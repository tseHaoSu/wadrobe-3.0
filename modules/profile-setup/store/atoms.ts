"use client";

import { atom } from "jotai";
import type {
  SetupStep,
  ProfileData,
  ClothingData,
  ClothingAnalysis,
  SetupState,
} from "../types";
import { STEP_ORDER } from "../types";

// Initial states
const initialProfileData: ProfileData = {
  height: null,
  weight: null,
  age: null,
  dressingStyle: "CASUAL",
};

const initialClothingData: ClothingData = {
  file: null,
  preview: null,
  analysis: null,
  isAnalyzing: false,
  error: null,
};

// Core atoms
export const currentStepAtom = atom<SetupStep>("height");
export const profileDataAtom = atom<ProfileData>(initialProfileData);
export const topClothingAtom = atom<ClothingData>(initialClothingData);
export const bottomClothingAtom = atom<ClothingData>(initialClothingData);
export const isSubmittingAtom = atom<boolean>(false);
export const setupErrorAtom = atom<string | null>(null);

// Derived atom for complete state
export const setupStateAtom = atom<SetupState>((get) => ({
  currentStep: get(currentStepAtom),
  profile: get(profileDataAtom),
  topClothing: get(topClothingAtom),
  bottomClothing: get(bottomClothingAtom),
  isSubmitting: get(isSubmittingAtom),
  error: get(setupErrorAtom),
}));

// Navigation atoms
export const canGoNextAtom = atom<boolean>((get) => {
  const currentStep = get(currentStepAtom);
  const profile = get(profileDataAtom);
  const topClothing = get(topClothingAtom);
  const bottomClothing = get(bottomClothingAtom);

  switch (currentStep) {
    case "height":
      return profile.height !== null && profile.height > 0;
    case "weight":
      return profile.weight !== null && profile.weight > 0;
    case "age":
      return profile.age !== null && profile.age > 0;
    case "dressingStyle":
      return true; // Always has a default value
    case "uploadTop":
      return topClothing.analysis !== null && !topClothing.isAnalyzing;
    case "uploadBottom":
      return bottomClothing.analysis !== null && !bottomClothing.isAnalyzing;
    case "review":
      return true;
    default:
      return false;
  }
});

export const canGoPrevAtom = atom<boolean>((get) => {
  const currentStep = get(currentStepAtom);
  return currentStep !== "height";
});

// Action atoms
export const goToNextStepAtom = atom(null, (get, set) => {
  const currentStep = get(currentStepAtom);
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex < STEP_ORDER.length - 1) {
    set(currentStepAtom, STEP_ORDER[currentIndex + 1]);
  }
});

export const goToPrevStepAtom = atom(null, (get, set) => {
  const currentStep = get(currentStepAtom);
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex > 0) {
    set(currentStepAtom, STEP_ORDER[currentIndex - 1]);
  }
});

export const updateProfileAtom = atom(
  null,
  (get, set, update: Partial<ProfileData>) => {
    const current = get(profileDataAtom);
    set(profileDataAtom, { ...current, ...update });
  }
);

export const updateTopClothingAtom = atom(
  null,
  (get, set, update: Partial<ClothingData>) => {
    const current = get(topClothingAtom);
    set(topClothingAtom, { ...current, ...update });
  }
);

export const updateBottomClothingAtom = atom(
  null,
  (get, set, update: Partial<ClothingData>) => {
    const current = get(bottomClothingAtom);
    set(bottomClothingAtom, { ...current, ...update });
  }
);

export const setClothingAnalysisAtom = atom(
  null,
  (
    get,
    set,
    payload: { type: "top" | "bottom"; analysis: ClothingAnalysis | null }
  ) => {
    const updateAtom =
      payload.type === "top" ? updateTopClothingAtom : updateBottomClothingAtom;
    set(updateAtom, { analysis: payload.analysis, isAnalyzing: false, error: null });
  }
);

export const setClothingErrorAtom = atom(
  null,
  (get, set, payload: { type: "top" | "bottom"; error: string }) => {
    const updateAtom =
      payload.type === "top" ? updateTopClothingAtom : updateBottomClothingAtom;
    set(updateAtom, { error: payload.error, isAnalyzing: false, analysis: null });
  }
);

export const resetSetupAtom = atom(null, (get, set) => {
  set(currentStepAtom, "height");
  set(profileDataAtom, initialProfileData);
  set(topClothingAtom, initialClothingData);
  set(bottomClothingAtom, initialClothingData);
  set(isSubmittingAtom, false);
  set(setupErrorAtom, null);
});

// Validation atom - checks if all data is complete
export const isSetupCompleteAtom = atom<boolean>((get) => {
  const profile = get(profileDataAtom);
  const topClothing = get(topClothingAtom);
  const bottomClothing = get(bottomClothingAtom);

  return (
    profile.height !== null &&
    profile.height > 0 &&
    profile.weight !== null &&
    profile.weight > 0 &&
    profile.age !== null &&
    profile.age > 0 &&
    topClothing.file !== null &&
    topClothing.analysis !== null &&
    bottomClothing.file !== null &&
    bottomClothing.analysis !== null
  );
});

// Progress atom
export const setupProgressAtom = atom<number>((get) => {
  const currentStep = get(currentStepAtom);
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  return ((currentIndex + 1) / STEP_ORDER.length) * 100;
});
