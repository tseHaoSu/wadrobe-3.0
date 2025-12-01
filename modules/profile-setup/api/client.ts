import type { ClothingAnalysis, ProfileData, ClothingCategory } from "../types";

interface ProfileCheckResponse {
  hasProfile: boolean;
  profile: ProfileData | null;
  clothingCount: Array<{ category: ClothingCategory; _count: { category: number } }>;
}

interface AnalyzeResponse {
  success: boolean;
  analysis?: ClothingAnalysis;
  error?: string;
  isClothing?: boolean;
  detectedCategory?: ClothingCategory;
  missingKey?: string;
}

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

interface SaveProfilePayload {
  height: number;
  weight: number;
  age: number;
  dressingStyle: string;
  clothing: {
    top: {
      name: string;
      description: string;
      category: ClothingCategory;
      color: string;
      brand: string | null;
      imageUrl: string;
    };
    bottom: {
      name: string;
      description: string;
      category: ClothingCategory;
      color: string;
      brand: string | null;
      imageUrl: string;
    };
  };
}

interface SaveProfileResponse {
  success: boolean;
  error?: string;
}

export async function checkUserProfile(): Promise<ProfileCheckResponse> {
  const response = await fetch("/api/user/profile", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to check profile");
  }

  return response.json();
}

export async function analyzeClothingImage(
  file: File,
  expectedCategory: "TOP" | "BOTTOM"
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("expectedCategory", expectedCategory);

  const response = await fetch("/api/clothing/analyze", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || "Failed to analyze clothing",
      isClothing: data.isClothing,
      detectedCategory: data.detectedCategory,
      missingKey: data.missingKey,
    };
  }

  return {
    success: true,
    analysis: data.analysis,
  };
}

export async function uploadClothingImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || "Failed to upload image",
    };
  }

  return {
    success: true,
    url: data.url,
  };
}

export async function saveProfile(
  payload: SaveProfilePayload
): Promise<SaveProfileResponse> {
  const response = await fetch("/api/user/profile", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || "Failed to save profile",
    };
  }

  return {
    success: true,
  };
}
