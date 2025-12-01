"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import {
  canGoNextAtom,
  canGoPrevAtom,
  goToNextStepAtom,
  goToPrevStepAtom,
  setupProgressAtom,
} from "../store/atoms";

interface StepLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showNavigation?: boolean;
  nextLabel?: string;
  onNext?: () => void;
  isLoading?: boolean;
}

export function StepLayout({
  title,
  subtitle,
  children,
  showNavigation = true,
  nextLabel = "Continue",
  onNext,
  isLoading = false,
}: StepLayoutProps) {
  const canGoNext = useAtomValue(canGoNextAtom);
  const canGoPrev = useAtomValue(canGoPrevAtom);
  const progress = useAtomValue(setupProgressAtom);
  const goToNext = useSetAtom(goToNextStepAtom);
  const goToPrev = useSetAtom(goToPrevStepAtom);

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      goToNext();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg border-2 border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-full mb-4">
              <Sparkles className="w-6 h-6 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              {title}
            </h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {/* Content */}
          <div className="mb-8">{children}</div>

          {/* Navigation */}
          {showNavigation && (
            <div className="flex gap-4">
              {canGoPrev && (
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl border-2 border-border transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {nextLabel}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
