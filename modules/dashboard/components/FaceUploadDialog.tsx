"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClothingDropzone } from "@/modules/profile-setup/components/ClothingDropzone";

interface FaceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  preview: string | null;
  isAnalyzing: boolean;
  error: string | null;
  verified: boolean;
  isSaving: boolean;
  onDrop: (files: File[]) => void;
  onRemove: () => void;
  onSave: () => void;
}

export function FaceUploadDialog({
  open,
  onOpenChange,
  file,
  preview,
  isAnalyzing,
  error,
  verified,
  isSaving,
  onDrop,
  onRemove,
  onSave,
}: FaceUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-2xl border-2 border-border shadow-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-card-foreground">
            Upload Profile Picture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ClothingDropzone
            file={file}
            preview={preview}
            analysis={null}
            isAnalyzing={isAnalyzing}
            error={error}
            onDrop={onDrop}
            onRemove={onRemove}
          >
            {!file ? (
              <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
                <p className="font-semibold text-card-foreground">
                  Upload your profile picture
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click or drag to upload
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  PNG or JPG, max 10MB
                </p>
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
                <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="font-semibold text-card-foreground">
                  Verifying your photo...
                </p>
              </div>
            ) : verified ? (
              <div className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted shrink-0 border-2 border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview || ""}
                      alt="Face preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-primary-foreground">
                            ✓
                          </span>
                        </div>
                        <span className="font-bold text-card-foreground">
                          Photo verified!
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Your profile picture looks great
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </ClothingDropzone>

          {/* Action Buttons - Only show when verified */}
          {verified && !isAnalyzing && (
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
                {isSaving ? "Saving..." : "Save Photo"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
