"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { profileDataAtom, updateProfileAtom } from "../../store/atoms";
import { StepLayout } from "../StepLayout";
import { Slider } from "@/components/ui/slider";

export function AgeStep() {
  const profile = useAtomValue(profileDataAtom);
  const updateProfile = useSetAtom(updateProfileAtom);

  const age = profile.age ?? 25;

  const handleSliderChange = (values: number[]) => {
    updateProfile({ age: values[0] });
  };

  return (
    <StepLayout title="How old are you?">
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-block bg-card rounded-2xl shadow-lg border-2 border-border px-8 py-6">
            <div className="text-6xl font-bold text-primary">{age}</div>
            <div className="text-sm text-muted-foreground font-semibold mt-1">
              years
            </div>
          </div>
        </div>

        <Slider
          value={[age]}
          onValueChange={handleSliderChange}
          min={13}
          max={120}
          step={1}
          className="w-full"
        />
      </div>
    </StepLayout>
  );
}
