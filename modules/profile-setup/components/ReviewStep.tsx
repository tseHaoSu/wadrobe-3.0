"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { Check, Sparkles, Ruler, Scale, Calendar, Palette, Shirt } from "lucide-react";
import { toast } from "sonner";
import {
  profileDataAtom,
  topClothingAtom,
  bottomClothingAtom,
  isSetupCompleteAtom,
  resetSetupAtom,
  goToPrevStepAtom,
  canGoPrevAtom,
  setupProgressAtom,
} from "../store/atoms";
import { DRESSING_STYLES } from "../types";
import { uploadClothingImage, saveProfile } from "../api/client";

interface ReviewStepProps {
  onComplete: () => void;
}

export function ReviewStep({ onComplete }: ReviewStepProps) {
  const profile = useAtomValue(profileDataAtom);
  const topClothing = useAtomValue(topClothingAtom);
  const bottomClothing = useAtomValue(bottomClothingAtom);
  const isComplete = useAtomValue(isSetupCompleteAtom);
  const canGoPrev = useAtomValue(canGoPrevAtom);
  const progress = useAtomValue(setupProgressAtom);
  const resetSetup = useSetAtom(resetSetupAtom);
  const goToPrev = useSetAtom(goToPrevStepAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styleLabel =
    DRESSING_STYLES.find((s) => s.value === profile.dressingStyle)?.label ||
    profile.dressingStyle;

  const handleSubmit = async () => {
    if (!isComplete) {
      toast.error("Please complete all steps before submitting");
      return;
    }

    if (
      !topClothing.file ||
      !topClothing.analysis ||
      !bottomClothing.file ||
      !bottomClothing.analysis ||
      profile.height === null ||
      profile.weight === null ||
      profile.age === null
    ) {
      toast.error("Missing required data. Please start over.");
      resetSetup();
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to Digital Ocean Spaces
      const [topUpload, bottomUpload] = await Promise.all([
        uploadClothingImage(topClothing.file),
        uploadClothingImage(bottomClothing.file),
      ]);

      if (!topUpload.success || !topUpload.url) {
        throw new Error(topUpload.error || "Failed to upload top clothing image");
      }

      if (!bottomUpload.success || !bottomUpload.url) {
        throw new Error(bottomUpload.error || "Failed to upload bottom clothing image");
      }

      // Save profile and clothing data
      const saveResult = await saveProfile({
        height: profile.height,
        weight: profile.weight,
        age: profile.age,
        dressingStyle: profile.dressingStyle,
        clothing: {
          top: {
            name: topClothing.analysis.name,
            description: topClothing.analysis.description,
            category: topClothing.analysis.category,
            color: topClothing.analysis.color,
            brand: topClothing.analysis.brand,
            imageUrl: topUpload.url,
          },
          bottom: {
            name: bottomClothing.analysis.name,
            description: bottomClothing.analysis.description,
            category: bottomClothing.analysis.category,
            color: bottomClothing.analysis.color,
            brand: bottomClothing.analysis.brand,
            imageUrl: bottomUpload.url,
          },
        },
      });

      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save profile");
      }

      toast.success("Profile setup complete!");
      onComplete();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
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
            Ready to complete!
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg border-2 border-border p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-full mb-4">
              <Sparkles className="w-6 h-6 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Review Your Profile
            </h1>
            <p className="text-muted-foreground">
              Make sure everything looks good!
            </p>
          </div>

          {/* Profile summary */}
          <div className="space-y-4 mb-6">
            <div className="bg-accent/30 rounded-xl p-4">
              <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Your Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Height:</span>
                  <span className="font-medium text-card-foreground">
                    {profile.height} cm
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Scale className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium text-card-foreground">
                    {profile.weight} kg
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Age:</span>
                  <span className="font-medium text-card-foreground">
                    {profile.age} years
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Style:</span>
                  <span className="font-medium text-card-foreground">
                    {styleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Clothing items */}
            <div className="bg-accent/30 rounded-xl p-4">
              <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <Shirt className="w-4 h-4 text-primary" />
                Your Clothing
              </h3>
              <div className="space-y-3">
                {/* Top */}
                {topClothing.preview && topClothing.analysis && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={topClothing.preview}
                        alt="Top clothing"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-card-foreground text-sm truncate">
                        {topClothing.analysis.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {topClothing.analysis.color}
                        {topClothing.analysis.brand
                          ? ` • ${topClothing.analysis.brand}`
                          : ""}
                      </p>
                    </div>
                  </div>
                )}
                {/* Bottom */}
                {bottomClothing.preview && bottomClothing.analysis && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bottomClothing.preview}
                        alt="Bottom clothing"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-card-foreground text-sm truncate">
                        {bottomClothing.analysis.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bottomClothing.analysis.color}
                        {bottomClothing.analysis.brand
                          ? ` • ${bottomClothing.analysis.brand}`
                          : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            {canGoPrev && (
              <button
                type="button"
                onClick={goToPrev}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl border-2 border-border transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isComplete || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
