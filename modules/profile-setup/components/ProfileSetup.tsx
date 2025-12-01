"use client";

import { useAtomValue } from "jotai";
import { AnimatePresence } from "framer-motion";
import { currentStepAtom } from "../store/atoms";
import { HeightStep } from "./steps/HeightStep";
import { WeightStep } from "./steps/WeightStep";
import { AgeStep } from "./steps/AgeStep";
import { DressingStyleStep } from "./steps/DressingStyleStep";
import { UploadTopStep } from "./steps/UploadTopStep";
import { UploadBottomStep } from "./steps/UploadBottomStep";
import { ReviewStep } from "./steps/ReviewStep";

interface ProfileSetupProps {
  onComplete: () => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const currentStep = useAtomValue(currentStepAtom);

  const renderStep = () => {
    switch (currentStep) {
      case "height":
        return <HeightStep key="height" />;
      case "weight":
        return <WeightStep key="weight" />;
      case "age":
        return <AgeStep key="age" />;
      case "dressingStyle":
        return <DressingStyleStep key="dressingStyle" />;
      case "uploadTop":
        return <UploadTopStep key="uploadTop" />;
      case "uploadBottom":
        return <UploadBottomStep key="uploadBottom" />;
      case "review":
        return <ReviewStep key="review" onComplete={onComplete} />;
      default:
        return <HeightStep key="height" />;
    }
  };

  return <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>;
}
