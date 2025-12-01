"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Scale } from "lucide-react";
import { profileDataAtom, updateProfileAtom, goToNextStepAtom } from "../store/atoms";
import { StepLayout } from "./StepLayout";

export function WeightStep() {
  const profile = useAtomValue(profileDataAtom);
  const updateProfile = useSetAtom(updateProfileAtom);
  const goToNext = useSetAtom(goToNextStepAtom);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === "" ? null : parseFloat(value);
    updateProfile({ weight: numValue });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && profile.weight !== null && profile.weight > 0) {
      goToNext();
    }
  };

  return (
    <StepLayout
      title="What's your weight?"
      subtitle="We use this to personalize your style recommendations"
    >
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Scale className="w-5 h-5" />
          </div>
          <input
            type="number"
            value={profile.weight ?? ""}
            onChange={handleWeightChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your weight"
            min="20"
            max="300"
            step="0.1"
            className="w-full pl-12 pr-16 py-4 rounded-xl border-2 border-input bg-background text-foreground text-lg focus:ring-2 focus:ring-ring focus:border-primary focus:shadow-md outline-none transition-all duration-200 placeholder:text-muted-foreground"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            kg
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Enter your weight in kilograms (20-300 kg)
        </p>
      </div>
    </StepLayout>
  );
}
