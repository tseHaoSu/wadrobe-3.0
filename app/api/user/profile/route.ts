import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// Define types locally to avoid Prisma client regeneration issues
// These types match the Prisma schema and will be available after running `prisma generate`
type DressingStyle = "CASUAL" | "FORMAL" | "SPORTY" | "STREETWEAR" | "MINIMALIST";
type ClothingCategory = "HEAD" | "TOP" | "BOTTOM";

interface ProfilePayload {
  height: number;
  weight: number;
  age: number;
  dressingStyle: DressingStyle;
  clothing: {
    top: ClothingItem;
    bottom: ClothingItem;
  };
}

interface ClothingItem {
  name: string;
  description: string;
  category: ClothingCategory;
  color: string;
  brand: string | null;
  imageUrl: string;
}

interface ClothingCount {
  category: ClothingCategory;
  _count: { category: number };
}

// Extended Prisma client type for models that need regeneration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// GET - Check if user has a profile
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", shouldClearSession: true },
        { status: 404 }
      );
    }

    const profile = await db.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Check if user has at least one top and one bottom clothing
    const clothingCount: ClothingCount[] = await db.clothing.groupBy({
      by: ["category"],
      where: { userId: session.user.id },
      _count: { category: true },
    });

    const hasTop = clothingCount.some(
      (c: ClothingCount) => c.category === "TOP" && c._count.category > 0
    );
    const hasBottom = clothingCount.some(
      (c: ClothingCount) => c.category === "BOTTOM" && c._count.category > 0
    );

    const isProfileComplete = profile !== null && hasTop && hasBottom;

    return NextResponse.json({
      hasProfile: isProfileComplete,
      profile: profile,
      clothingCount: clothingCount,
    });
  } catch (error) {
    console.error("Error checking profile:", error);
    return NextResponse.json(
      { error: "Failed to check profile" },
      { status: 500 }
    );
  }
}

// POST - Save profile and clothing data
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json() as ProfilePayload;
    const { height, weight, age, dressingStyle, clothing } = body;

    // Validate all required fields
    if (
      !height ||
      !weight ||
      !age ||
      !dressingStyle ||
      !clothing?.top ||
      !clothing?.bottom
    ) {
      return NextResponse.json(
        { error: "All fields are required. Please complete the entire setup." },
        { status: 400 }
      );
    }

    // Validate clothing data
    if (
      !clothing.top.name ||
      !clothing.top.imageUrl ||
      !clothing.bottom.name ||
      !clothing.bottom.imageUrl
    ) {
      return NextResponse.json(
        { error: "Clothing items must have a name and image." },
        { status: 400 }
      );
    }

    // Use transaction to ensure all data is saved or none
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await db.$transaction(async (tx: any) => {
      // Upsert profile (create or update)
      const profile = await tx.userProfile.upsert({
        where: { userId: session.user.id },
        update: {
          height,
          weight,
          age,
          dressingStyle,
        },
        create: {
          userId: session.user.id,
          height,
          weight,
          age,
          dressingStyle,
        },
      });

      // Create top clothing item
      const topClothing = await tx.clothing.create({
        data: {
          userId: session.user.id,
          name: clothing.top.name,
          description: clothing.top.description,
          category: clothing.top.category,
          color: clothing.top.color,
          brand: clothing.top.brand,
          imageUrl: clothing.top.imageUrl,
        },
      });

      // Create bottom clothing item
      const bottomClothing = await tx.clothing.create({
        data: {
          userId: session.user.id,
          name: clothing.bottom.name,
          description: clothing.bottom.description,
          category: clothing.bottom.category,
          color: clothing.bottom.color,
          brand: clothing.bottom.brand,
          imageUrl: clothing.bottom.imageUrl,
        },
      });

      return { profile, topClothing, bottomClothing };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile. Please try again." },
      { status: 500 }
    );
  }
}

