"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClothingDropzone, ClothingDropzoneContent } from "@/modules/profile-setup/components/ClothingDropzone";
import type { ClothingAnalysis } from "@/modules/profile-setup/types";

interface AddClothingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: "HEAD" | "TOP" | "BOTTOM";
  file: File | null;
  preview: string | null;
  analysis: ClothingAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  isSaving: boolean;
  onDrop: (files: File[]) => void;
  onRemove: () => void;
  onSave: () => void;
}

export function AddClothingDialog({
  open,
  onOpenChange,
  category,
  file,
  preview,
  analysis,
  isAnalyzing,
  error,
  isSaving,
  onDrop,
  onRemove,
  onSave,
}: AddClothingDialogProps) {
  const categoryNames = {
    HEAD: "Head",
    TOP: "Top",
    BOTTOM: "Bottom",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-2xl border-2 border-border shadow-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-card-foreground">
            Add {categoryNames[category]} Clothing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ClothingDropzone
            file={file}
            preview={preview}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            error={error}
            onDrop={onDrop}
            onRemove={onRemove}
          >
            <ClothingDropzoneContent />
          </ClothingDropzone>

          {/* Action Buttons - Only show when analysis is complete */}
          {analysis && !isAnalyzing && (
            <div className="flex gap-3">
              <button
                onClick={onRemove}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 px-4 rounded-xl border-2 border-border transition shadow-sm"
              >
                Try Another
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Item"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
