"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { toast } from "sonner";
import { topClothingAtom, updateTopClothingAtom } from "../../store/atoms";
import { analyzeClothingImage } from "../../api/client";
import { StepLayout } from "../StepLayout";
import { ClothingDropzone, ClothingDropzoneContent } from "../ClothingDropzone";

export function UploadTopStep() {
  const topClothing = useAtomValue(topClothingAtom);
  const updateTopClothing = useSetAtom(updateTopClothingAtom);

  const handleDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Create preview URL
    const preview = URL.createObjectURL(file);

    // Update state with file and preview
    updateTopClothing({
      file,
      preview,
      analysis: null,
      isAnalyzing: true,
      error: null,
    });

    // Analyze the image
    const result = await analyzeClothingImage(file, "TOP");

    if (!result.success || !result.analysis) {
      const errorMessage = result.error || "Failed to analyze clothing";
      updateTopClothing({
        isAnalyzing: false,
        error: result.missingKey
          ? `Missing ${result.missingKey} API key`
          : errorMessage,
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
    updateTopClothing({
      analysis: result.analysis,
      isAnalyzing: false,
      error: null,
    });

    toast.success(`Identified: ${result.analysis.name}`);
  };

  const handleRemove = () => {
    // Clean up preview URL
    if (topClothing.preview) {
      URL.revokeObjectURL(topClothing.preview);
    }

    updateTopClothing({
      file: null,
      preview: null,
      analysis: null,
      isAnalyzing: false,
      error: null,
    });
  };

  return (
    <StepLayout title="Upload a Top">
      <ClothingDropzone
        file={topClothing.file}
        preview={topClothing.preview}
        analysis={topClothing.analysis}
        isAnalyzing={topClothing.isAnalyzing}
        error={topClothing.error}
        onDrop={handleDrop}
        onRemove={handleRemove}
      >
        <ClothingDropzoneContent />
      </ClothingDropzone>
    </StepLayout>
  );
}
