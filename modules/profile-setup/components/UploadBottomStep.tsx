"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { toast } from "sonner";
import { bottomClothingAtom, updateBottomClothingAtom } from "../store/atoms";
import { analyzeClothingImage } from "../api/client";
import { StepLayout } from "./StepLayout";
import { ClothingDropzone, ClothingDropzoneContent } from "./ClothingDropzone";

export function UploadBottomStep() {
  const bottomClothing = useAtomValue(bottomClothingAtom);
  const updateBottomClothing = useSetAtom(updateBottomClothingAtom);

  const handleDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Create preview URL
    const preview = URL.createObjectURL(file);

    // Update state with file and preview
    updateBottomClothing({
      file,
      preview,
      analysis: null,
      isAnalyzing: true,
      error: null,
    });

    // Analyze the image
    const result = await analyzeClothingImage(file, "BOTTOM");

    if (!result.success || !result.analysis) {
      const errorMessage = result.error || "Failed to analyze clothing";
      updateBottomClothing({
        isAnalyzing: false,
        error: result.missingKey ? `Missing ${result.missingKey} API key` : errorMessage,
        analysis: null,
      });

      // Show specific toast for missing API key
      if (result.missingKey) {
        toast.error(`Missing ${result.missingKey} API key`);
      } else {
        toast.error(errorMessage);
      }
      return;
    }

    // Success - update with analysis
    updateBottomClothing({
      analysis: result.analysis,
      isAnalyzing: false,
      error: null,
    });

    toast.success(`Identified: ${result.analysis.name}`);
  };

  const handleRemove = () => {
    // Clean up preview URL
    if (bottomClothing.preview) {
      URL.revokeObjectURL(bottomClothing.preview);
    }

    updateBottomClothing({
      file: null,
      preview: null,
      analysis: null,
      isAnalyzing: false,
      error: null,
    });
  };

  return (
    <StepLayout
      title="Upload a Bottom"
      subtitle="Add pants, shorts, a skirt, or any lower body clothing"
    >
      <ClothingDropzone
        file={bottomClothing.file}
        preview={bottomClothing.preview}
        analysis={bottomClothing.analysis}
        isAnalyzing={bottomClothing.isAnalyzing}
        error={bottomClothing.error}
        onDrop={handleDrop}
        onRemove={handleRemove}
      >
        <ClothingDropzoneContent />
      </ClothingDropzone>
    </StepLayout>
  );
}
