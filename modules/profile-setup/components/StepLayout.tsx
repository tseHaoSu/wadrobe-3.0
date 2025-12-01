"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  canGoNextAtom,
  canGoPrevAtom,
  goToNextStepAtom,
  goToPrevStepAtom,
  setupProgressAtom,
} from "../store/atoms";

interface StepLayoutProps {
  title: string;
  subtitle?: string;
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
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-card rounded-2xl shadow-lg border-2 border-border p-8"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0.0, 0.2, 1],
          }}
        >
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              {title}
            </h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </motion.div>

          {/* Content */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {children}
          </motion.div>

          {/* Navigation */}
          {showNavigation && (
            <motion.div
              className="flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
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
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
