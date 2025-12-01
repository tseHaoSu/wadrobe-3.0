import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schema for face verification response
const faceAnalysisSchema = z.object({
  isFace: z.boolean().describe("Whether the image contains a clear human face"),
  quality: z.enum(["good", "acceptable", "poor"]).describe("Quality of the face photo for profile purposes"),
  issues: z.array(z.string()).describe("List of any issues (e.g., 'blurry', 'too dark', 'multiple faces', 'face not centered')"),
});

export async function POST(request: NextRequest) {
  try {
    // Check for required API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GOOGLE_GENERATIVE_AI_API_KEY API key", missingKey: "GOOGLE_GENERATIVE_AI_API_KEY" },
        { status: 500 }
      );
    }

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
      schema: faceAnalysisSchema,
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
              text: `Analyze this image to verify it's suitable for a profile picture. Check if:
1. It contains a clear human face
2. The face is centered and visible
3. The quality is good (not blurry, well-lit, not too dark)
4. There's only one face in the image
5. The face is not obscured

Provide your assessment including whether it's a suitable face photo, the quality level, and any issues you notice.`,
            },
          ],
        },
      ],
    });

    const analysis = result.object;

    // Check if it's actually a face
    if (!analysis.isFace) {
      return NextResponse.json(
        {
          error: "This doesn't appear to contain a clear face. Please upload a photo of yourself.",
          isFace: false,
          issues: analysis.issues
        },
        { status: 400 }
      );
    }

    // Check quality
    if (analysis.quality === "poor") {
      return NextResponse.json(
        {
          error: `Photo quality is too low. Issues: ${analysis.issues.join(", ")}. Please upload a clearer photo.`,
          isFace: true,
          quality: analysis.quality,
          issues: analysis.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: {
        isFace: analysis.isFace,
        quality: analysis.quality,
        issues: analysis.issues,
      },
    });
  } catch (error) {
    console.error("Error analyzing face:", error);

    // Check for API key related errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("API key") || errorMessage.includes("GOOGLE_GENERATIVE_AI_API_KEY")) {
      return NextResponse.json(
        { error: "Missing GOOGLE_GENERATIVE_AI_API_KEY API key", missingKey: "GOOGLE_GENERATIVE_AI_API_KEY" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze face image. Please try again." },
      { status: 500 }
    );
  }
}
