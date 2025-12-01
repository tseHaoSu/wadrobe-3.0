"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Check } from "lucide-react";
import { profileDataAtom, updateProfileAtom } from "../../store/atoms";
import { DRESSING_STYLES, type DressingStyle } from "../../types";
import { StepLayout } from "../StepLayout";

export function DressingStyleStep() {
  const profile = useAtomValue(profileDataAtom);
  const updateProfile = useSetAtom(updateProfileAtom);

  const handleStyleSelect = (style: DressingStyle) => {
    updateProfile({ dressingStyle: style });
  };

  return (
    <StepLayout title="What's your style?">
      <div className="space-y-3">
        {DRESSING_STYLES.map((style) => {
          const isSelected = profile.dressingStyle === style.value;
          return (
            <button
              key={style.value}
              type="button"
              onClick={() => handleStyleSelect(style.value)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                isSelected
                  ? "border-primary bg-accent shadow-md"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    {style.label}
                  </h3>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </StepLayout>
  );
}
