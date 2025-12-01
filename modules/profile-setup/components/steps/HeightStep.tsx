"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { profileDataAtom, updateProfileAtom } from "../../store/atoms";
import { StepLayout } from "../StepLayout";
import { Slider } from "@/components/ui/slider";

export function HeightStep() {
  const profile = useAtomValue(profileDataAtom);
  const updateProfile = useSetAtom(updateProfileAtom);

  const height = profile.height ?? 170;

  const handleSliderChange = (values: number[]) => {
    updateProfile({ height: values[0] });
  };

  return (
    <StepLayout title="What's your height?">
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-block bg-card rounded-2xl shadow-lg border-2 border-border px-8 py-6">
            <div className="text-6xl font-bold text-primary">{height}</div>
            <div className="text-sm text-muted-foreground font-semibold mt-1">
              cm
            </div>
          </div>
        </div>

        <Slider
          value={[height]}
          onValueChange={handleSliderChange}
          min={50}
          max={250}
          step={1}
          className="w-full"
        />
      </div>
    </StepLayout>
  );
}
