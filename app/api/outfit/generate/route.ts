import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GoogleGenAI } from "@google/genai";

// Initialize with single API key
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

interface GenerateOutfitRequest {
  profilePicUrl: string;
  topImageUrl?: string;
  bottomImageUrl?: string;
  height?: number;
  weight?: number;
  age?: number;
  dressingStyle?: string;
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GOOGLE_GENERATIVE_AI_API_KEY" },
        { status: 500 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as GenerateOutfitRequest;
    const {
      profilePicUrl,
      topImageUrl,
      bottomImageUrl,
      height,
      weight,
      age,
      dressingStyle,
    } = body;

    if (!profilePicUrl) {
      return NextResponse.json(
        { error: "Profile picture URL is required" },
        { status: 400 }
      );
    }

    console.log("=== DEBUG: Starting outfit generation ===");
    console.log("DEBUG: profilePicUrl:", profilePicUrl);
    console.log("DEBUG: topImageUrl:", topImageUrl);
    console.log("DEBUG: bottomImageUrl:", bottomImageUrl);

    // Fetch all images in parallel
    const imagePromises: Promise<{ type: string; data: string }>[] = [
      fetchImageAsBase64(profilePicUrl).then((data) => ({
        type: "profile",
        data,
      })),
    ];

    if (topImageUrl) {
      imagePromises.push(
        fetchImageAsBase64(topImageUrl).then((data) => ({ type: "top", data }))
      );
    }
    if (bottomImageUrl) {
      imagePromises.push(
        fetchImageAsBase64(bottomImageUrl).then((data) => ({
          type: "bottom",
          data,
        }))
      );
    }

    console.log("DEBUG: Fetching images...");
    const images = await Promise.all(imagePromises);
    console.log("DEBUG: Images fetched successfully, count:", images.length);

    // Build user context
    const userInfo = [];
    if (height) userInfo.push(`${height}cm tall`);
    if (weight) userInfo.push(`${weight}kg`);
    if (age) userInfo.push(`${age} years old`);
    if (dressingStyle) userInfo.push(`prefers ${dressingStyle} style`);

    const userContext =
      userInfo.length > 0 ? ` The person is ${userInfo.join(", ")}.` : "";

    // Build clothing descriptions
    const clothingDescriptions = [];
    if (topImageUrl) clothingDescriptions.push("the top/shirt");
    if (bottomImageUrl) clothingDescriptions.push("the pants/bottom");

    const prompt = `Generate a full-body fashion photo of this person wearing ${clothingDescriptions.join(
      " and "
    )} from the reference images.${userContext}

The first image is the person's face - maintain their exact facial features.
The following images are clothing items to dress them in.
Create a natural, realistic fashion photo with professional lighting.`;

    // Build contents: text + images
    const contents: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [
      { text: prompt },
      ...images.map((img) => ({
        inlineData: {
          mimeType: "image/jpeg" as const,
          data: img.data,
        },
      })),
    ];

    console.log("DEBUG: Calling Gemini API with model: gemini-2.5-flash-image");
    console.log("DEBUG: Prompt:", prompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: contents,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    console.log("DEBUG: Gemini API response received");
    console.log("DEBUG: Response candidates:", JSON.stringify(response.candidates, null, 2));

    // Extract generated image
    let generatedImageBase64: string | undefined;
    let textResponse = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          textResponse += part.text;
        } else if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data;
        }
      }
    }

    if (!generatedImageBase64) {
      return NextResponse.json(
        {
          error: "No image was generated",
          details: textResponse || "Model did not return an image.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${generatedImageBase64}`,
    });
  } catch (error: unknown) {
    console.error("Error generating outfit:", error);

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("429")) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Enable billing at https://aistudio.google.com/apikey",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate outfit image", details: errorMessage },
      { status: 500 }
    );
  }
}
