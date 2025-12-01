"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Calendar } from "lucide-react";
import { profileDataAtom, updateProfileAtom, goToNextStepAtom } from "../store/atoms";
import { StepLayout } from "./StepLayout";

export function AgeStep() {
  const profile = useAtomValue(profileDataAtom);
  const updateProfile = useSetAtom(updateProfileAtom);
  const goToNext = useSetAtom(goToNextStepAtom);

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === "" ? null : parseInt(value, 10);
    updateProfile({ age: numValue });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && profile.age !== null && profile.age > 0) {
      goToNext();
    }
  };

  return (
    <StepLayout
      title="How old are you?"
      subtitle="This helps us tailor age-appropriate style suggestions"
    >
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
          </div>
          <input
            type="number"
            value={profile.age ?? ""}
            onChange={handleAgeChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your age"
            min="13"
            max="120"
            step="1"
            className="w-full pl-12 pr-20 py-4 rounded-xl border-2 border-input bg-background text-foreground text-lg focus:ring-2 focus:ring-ring focus:border-primary focus:shadow-md outline-none transition-all duration-200 placeholder:text-muted-foreground"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            years
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Enter your age in years (13-120)
        </p>
      </div>
    </StepLayout>
  );
}
