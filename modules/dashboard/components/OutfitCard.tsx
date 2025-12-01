"use client";

import { Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

interface ClothingItem {
  id: string;
  name: string;
  category: "HEAD" | "TOP" | "BOTTOM";
  imageUrl: string;
  color?: string;
  brand?: string;
}

interface UserProfile {
  height: number | null;
  weight: number | null;
  age: number | null;
  dressingStyle: string;
  profilePic: string | null;
}

interface OutfitCardProps {
  selectedItems: {
    head?: ClothingItem;
    top?: ClothingItem;
    bottom?: ClothingItem;
  };
  profilePicUrl: string | null;
  userProfile?: UserProfile | null;
  onRemoveItem: (item: ClothingItem) => void;
}

export function OutfitCard({
  selectedItems,
  profilePicUrl,
  userProfile,
  onRemoveItem,
}: OutfitCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const hasItems =
    selectedItems.head || selectedItems.top || selectedItems.bottom;

  const handleGenerateOutfit = async () => {
    if (!profilePicUrl) {
      toast.error("Please upload a profile picture first");
      return;
    }

    if (!hasItems) {
      toast.error("Please select at least one clothing item");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/outfit/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profilePicUrl: profilePicUrl,
          headImageUrl: selectedItems.head?.imageUrl,
          topImageUrl: selectedItems.top?.imageUrl,
          bottomImageUrl: selectedItems.bottom?.imageUrl,
          height: userProfile?.height,
          weight: userProfile?.weight,
          age: userProfile?.age,
          dressingStyle: userProfile?.dressingStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate outfit");
      }

      setGeneratedImage(data.image);
      toast.success("Outfit generated successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate outfit";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-lg border-2 border-border overflow-hidden">
      <CardHeader className="bg-accent/20">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Generated Outfit
        </CardTitle>
        <CardDescription className="space-y-2">
          {hasItems ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedItems.head && (
                <Badge
                  variant="secondary"
                  onClick={() => onRemoveItem(selectedItems.head!)}
                  className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:scale-105 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {selectedItems.head.name}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {selectedItems.top && (
                <Badge
                  variant="secondary"
                  onClick={() => onRemoveItem(selectedItems.top!)}
                  className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:scale-105 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {selectedItems.top.name}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {selectedItems.bottom && (
                <Badge
                  variant="secondary"
                  onClick={() => onRemoveItem(selectedItems.bottom!)}
                  className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:scale-105 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {selectedItems.bottom.name}
                  <X className="w-3 h-3" />
                </Badge>
              )}
            </div>
          ) : (
            <span>Select items to create your outfit</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
          {isGenerating ? (
            <div className="text-center p-4">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-card-foreground font-medium">
                Generating your outfit...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This may take a moment
              </p>
            </div>
          ) : generatedImage ? (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedImage}
                alt="Generated outfit"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="text-center p-4">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {hasItems && profilePicUrl
                  ? "Ready to generate your outfit!"
                  : hasItems
                  ? "Upload a profile picture first"
                  : "Select clothing items to get started"}
              </p>
              {hasItems && profilePicUrl && (
                <button
                  onClick={handleGenerateOutfit}
                  disabled={isGenerating}
                  className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Outfit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Regenerate button when image is shown */}
        {generatedImage && !isGenerating && (
          <button
            onClick={handleGenerateOutfit}
            className="mt-4 w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 px-4 rounded-xl border-2 border-border transition shadow-sm"
          >
            Regenerate Outfit
          </button>
        )}
      </CardContent>
    </Card>
  );
}
