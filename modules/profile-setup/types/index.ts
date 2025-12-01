// Define types locally to avoid Prisma client regeneration issues
export type ClothingCategory = "HEAD" | "TOP" | "BOTTOM";
export type DressingStyle = "CASUAL" | "FORMAL" | "SPORTY" | "STREETWEAR" | "MINIMALIST";

export type SetupStep =
  | "height"
  | "weight"
  | "age"
  | "dressingStyle"
  | "uploadTop"
  | "uploadBottom"
  | "review";

export interface ProfileData {
  height: number | null;
  weight: number | null;
  age: number | null;
  dressingStyle: DressingStyle;
}

export interface ClothingData {
  file: File | null;
  preview: string | null;
  analysis: ClothingAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
}

export interface ClothingAnalysis {
  name: string;
  description: string;
  category: ClothingCategory;
  color: string;
  brand: string | null;
}

export interface SetupState {
  currentStep: SetupStep;
  profile: ProfileData;
  topClothing: ClothingData;
  bottomClothing: ClothingData;
  isSubmitting: boolean;
  error: string | null;
}

export const STEP_ORDER: SetupStep[] = [
  "height",
  "weight",
  "age",
  "dressingStyle",
  "uploadTop",
  "uploadBottom",
  "review",
];

export const DRESSING_STYLES: { value: DressingStyle; label: string; description: string }[] = [
  { value: "CASUAL", label: "Casual", description: "Relaxed and comfortable everyday wear" },
  { value: "FORMAL", label: "Formal", description: "Professional and polished attire" },
  { value: "SPORTY", label: "Sporty", description: "Athletic and active lifestyle clothing" },
  { value: "STREETWEAR", label: "Streetwear", description: "Urban and trendy fashion" },
  { value: "MINIMALIST", label: "Minimalist", description: "Simple and clean aesthetic" },
];
