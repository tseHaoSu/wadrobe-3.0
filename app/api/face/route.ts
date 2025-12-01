import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// Extended Prisma client type for models that need regeneration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// GET - Fetch user's profile picture
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
      return NextResponse.json(
        { error: "User not found", shouldClearSession: true },
        { status: 404 }
      );
    }

    const profile = await db.userProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        profilePic: true,
      },
    });

    return NextResponse.json({
      success: true,
      profilePic: profile?.profilePic || null,
    });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile picture" },
      { status: 500 }
    );
  }
}

// POST - Upload profile picture
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

    const body = await request.json();
    const { profilePic } = body;

    if (!profilePic || typeof profilePic !== "string") {
      return NextResponse.json(
        { error: "Profile picture URL is required" },
        { status: 400 }
      );
    }

    // Upsert profile with profile picture
    const profile = await db.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        profilePic,
      },
      create: {
        userId: session.user.id,
        profilePic,
      },
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return NextResponse.json(
      { error: "Failed to upload profile picture" },
      { status: 500 }
    );
  }
}
