import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// Define types locally to match Prisma schema
type ClothingCategory = "HEAD" | "TOP" | "BOTTOM";

interface CreateClothingPayload {
  name: string;
  description: string;
  category: ClothingCategory;
  color: string;
  brand: string | null;
  imageUrl: string;
}

// Extended Prisma client type for models that need regeneration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// GET - Fetch user's clothing items
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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      // User doesn't exist in database, clear session
      return NextResponse.json(
        { error: "User not found", shouldClearSession: true },
        { status: 404 }
      );
    }

    const clothing = await db.clothing.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      clothing,
    });
  } catch (error) {
    console.error("Error fetching clothing:", error);
    return NextResponse.json(
      { error: "Failed to fetch clothing" },
      { status: 500 }
    );
  }
}

// POST - Create a new clothing item
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

    const body = await request.json() as CreateClothingPayload;
    const { name, description, category, color, brand, imageUrl } = body;

    // Validate required fields
    if (!name || !description || !category || !color || !imageUrl) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories: ClothingCategory[] = ["HEAD", "TOP", "BOTTOM"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be HEAD, TOP, or BOTTOM" },
        { status: 400 }
      );
    }

    // Create clothing item
    const clothing = await db.clothing.create({
      data: {
        userId: session.user.id,
        name,
        description,
        category,
        color,
        brand,
        imageUrl,
      },
    });

    return NextResponse.json({
      success: true,
      clothing,
    });
  } catch (error) {
    console.error("Error creating clothing:", error);
    return NextResponse.json(
      { error: "Failed to create clothing item" },
      { status: 500 }
    );
  }
}
