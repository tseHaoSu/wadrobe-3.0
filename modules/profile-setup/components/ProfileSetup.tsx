"use client";

import { useAtomValue } from "jotai";
import { currentStepAtom } from "../store/atoms";
import { HeightStep } from "./HeightStep";
import { WeightStep } from "./WeightStep";
import { AgeStep } from "./AgeStep";
import { DressingStyleStep } from "./DressingStyleStep";
import { UploadTopStep } from "./UploadTopStep";
import { UploadBottomStep } from "./UploadBottomStep";
import { ReviewStep } from "./ReviewStep";

interface ProfileSetupProps {
  onComplete: () => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const currentStep = useAtomValue(currentStepAtom);

  switch (currentStep) {
    case "height":
      return <HeightStep />;
    case "weight":
      return <WeightStep />;
    case "age":
      return <AgeStep />;
    case "dressingStyle":
      return <DressingStyleStep />;
    case "uploadTop":
      return <UploadTopStep />;
    case "uploadBottom":
      return <UploadBottomStep />;
    case "review":
      return <ReviewStep onComplete={onComplete} />;
    default:
      return <HeightStep />;
  }
}
