"use client";

import { X, Check } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/ui/badge";
import type { ClothingAnalysis } from "../types";

interface ClothingDropzoneContextType {
  file: File | null;
  preview: string | null;
  analysis: ClothingAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
}

const ClothingDropzoneContext = createContext<ClothingDropzoneContextType | undefined>(
  undefined
);

interface ClothingDropzoneProps {
  file: File | null;
  preview: string | null;
  analysis: ClothingAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  onDrop: (files: File[]) => void;
  onRemove: () => void;
  disabled?: boolean;
  children?: ReactNode;
}

export function ClothingDropzone({
  file,
  preview,
  analysis,
  isAnalyzing,
  error,
  onDrop,
  onRemove,
  disabled = false,
  children,
}: ClothingDropzoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles);
      }
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: handleDrop,
    disabled: disabled || isAnalyzing,
  });

  return (
    <ClothingDropzoneContext.Provider
      value={{ file, preview, analysis, isAnalyzing, error }}
    >
      <div className="relative">
        <div
          {...getRootProps()}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${
            isDragActive
              ? "border-primary bg-accent/50 scale-[1.02]"
              : error
              ? "border-destructive bg-destructive/5"
              : file && analysis
              ? "border-primary bg-accent/30"
              : "border-border bg-card hover:border-primary/50 hover:bg-accent/20"
          } ${disabled || isAnalyzing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <input {...getInputProps()} disabled={disabled || isAnalyzing} />
          {children}
        </div>
        {file && !isAnalyzing && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </ClothingDropzoneContext.Provider>
  );
}

function useClothingDropzoneContext() {
  const context = useContext(ClothingDropzoneContext);
  if (!context) {
    throw new Error(
      "useClothingDropzoneContext must be used within a ClothingDropzone"
    );
  }
  return context;
}

export function ClothingDropzoneContent() {
  const { file, preview, analysis, isAnalyzing, error } = useClothingDropzoneContext();

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-card-foreground">Analyzing your clothing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
        <p className="font-semibold text-destructive text-center">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Click or drag to try again
        </p>
      </div>
    );
  }

  if (file && preview && analysis) {
    return (
      <div className="p-4">
        <div className="flex gap-4">
          {/* Image preview */}
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Clothing preview"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Analysis info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-card-foreground truncate">
                {analysis.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {analysis.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="px-2 py-0.5 text-xs font-medium rounded-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--primary))] transition-all"
              >
                {analysis.color}
              </Badge>
              {analysis.brand && (
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 text-xs font-medium rounded-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--primary))] transition-all"
                >
                  {analysis.brand}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      <p className="font-semibold text-card-foreground">
        Upload your clothing image
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Click or drag to upload
      </p>
      <p className="text-xs text-muted-foreground mt-3">
        PNG or JPG, max 10MB
      </p>
    </div>
  );
}
