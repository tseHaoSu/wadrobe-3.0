"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { profileDataAtom, updateProfileAtom } from "../../store/atoms";
import { StepLayout } from "../StepLayout";
import { Slider } from "@/components/ui/slider";

export function WeightStep() {
  const profile = useAtomValue(profileDataAtom);
  const updateProfile = useSetAtom(updateProfileAtom);

  const weight = profile.weight ?? 70;

  const handleSliderChange = (values: number[]) => {
    updateProfile({ weight: values[0] });
  };

  return (
    <StepLayout title="What's your weight?">
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-block bg-card rounded-2xl shadow-lg border-2 border-border px-8 py-6">
            <div className="text-6xl font-bold text-primary">{weight}</div>
            <div className="text-sm text-muted-foreground font-semibold mt-1">kg</div>
          </div>
        </div>

        <Slider
          value={[weight]}
          onValueChange={handleSliderChange}
          min={20}
          max={300}
          step={1}
          className="w-full"
        />
      </div>
    </StepLayout>
  );
}
