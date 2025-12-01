import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToSpaces, ClothingCategory, UploadType } from "@/lib/storage";
import { headers } from "next/headers";

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

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const type = (formData.get("type") as UploadType) || "clothing";
    const category = formData.get("category") as ClothingCategory | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validate file type (PNG and JPG only)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG and JPG images are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate category for clothing uploads
    if (type === "clothing" && !category) {
      return NextResponse.json(
        { error: "Category is required for clothing uploads" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudflare R2
    const result = await uploadToSpaces(
      buffer,
      file.name,
      file.type,
      session.user.id,
      type,
      category || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to upload image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image. Please try again." },
      { status: 500 }
    );
  }
}
