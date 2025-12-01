import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schema for clothing analysis response
const clothingAnalysisSchema = z.object({
  isClothing: z.boolean().describe("Whether the image contains a clothing item"),
  name: z.string().describe("Short name of the clothing item, e.g., 'Black Hoodie', 'Blue Jeans'"),
  description: z.string().describe("Brief description of the clothing item"),
  category: z.enum(["HEAD", "TOP", "BOTTOM"]).describe("Category of the clothing: HEAD for hats/caps, TOP for shirts/jackets/hoodies, BOTTOM for pants/shorts/skirts"),
  color: z.string().describe("Primary color of the clothing item"),
  brand: z.string().nullable().describe("Brand name if visible, otherwise null"),
});

export const runtime = "edge";

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
    const expectedCategory = formData.get("expectedCategory") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type as "image/png" | "image/jpeg" | "image/webp" | "image/gif";

    // Analyze the image using Google Gemini Vision
    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: clothingAnalysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
            {
              type: "text",
              text: `Analyze this image and determine if it contains a clothing item. If it does, provide details about the clothing including its name, description, category (HEAD for hats/caps/beanies, TOP for shirts/jackets/hoodies/sweaters, BOTTOM for pants/shorts/skirts), color, and brand if visible. If the image does not contain a clear clothing item, set isClothing to false.${expectedCategory ? ` The user expects this to be a ${expectedCategory} item.` : ""}`,
            },
          ],
        },
      ],
    });

    const analysis = result.object;

    // Check if it's actually clothing
    if (!analysis.isClothing) {
      return NextResponse.json(
        {
          error: "This doesn't appear to be a clothing item. Please upload a clear image of clothing.",
          isClothing: false
        },
        { status: 400 }
      );
    }

    // If expected category is provided, validate it matches
    if (expectedCategory && analysis.category !== expectedCategory) {
      return NextResponse.json(
        {
          error: `This appears to be a ${analysis.category.toLowerCase()} item, but we need a ${expectedCategory.toLowerCase()} item. Please upload the correct type of clothing.`,
          isClothing: true,
          detectedCategory: analysis.category
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: {
        name: analysis.name,
        description: analysis.description,
        category: analysis.category,
        color: analysis.color,
        brand: analysis.brand,
      },
    });
  } catch (error) {
    console.error("Error analyzing clothing:", error);
    return NextResponse.json(
      { error: "Failed to analyze clothing image. Please try again." },
      { status: 500 }
    );
  }
}
