"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Ruler } from "lucide-react";
import { profileDataAtom, updateProfileAtom, goToNextStepAtom } from "../store/atoms";
import { StepLayout } from "./StepLayout";

export function HeightStep() {
  const profile = useAtomValue(profileDataAtom);
  const updateProfile = useSetAtom(updateProfileAtom);
  const goToNext = useSetAtom(goToNextStepAtom);

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === "" ? null : parseFloat(value);
    updateProfile({ height: numValue });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && profile.height !== null && profile.height > 0) {
      goToNext();
    }
  };

  return (
    <StepLayout
      title="What's your height?"
      subtitle="This helps us recommend the perfect fit for you"
    >
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Ruler className="w-5 h-5" />
          </div>
          <input
            type="number"
            value={profile.height ?? ""}
            onChange={handleHeightChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your height"
            min="50"
            max="250"
            step="0.1"
            className="w-full pl-12 pr-16 py-4 rounded-xl border-2 border-input bg-background text-foreground text-lg focus:ring-2 focus:ring-ring focus:border-primary focus:shadow-md outline-none transition-all duration-200 placeholder:text-muted-foreground"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            cm
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Enter your height in centimeters (50-250 cm)
        </p>
      </div>
    </StepLayout>
  );
}
