"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClothingItem {
  id: string;
  name: string;
  category: "HEAD" | "TOP" | "BOTTOM";
  imageUrl: string;
  color?: string;
  brand?: string;
}

interface ClothingSectionProps {
  category: "HEAD" | "TOP" | "BOTTOM";
  title: string;
  clothing: ClothingItem[];
  loading: boolean;
  selectedItem?: ClothingItem;
  onItemClick: (item: ClothingItem) => void;
  onAddClick: () => void;
}

export function ClothingSection({
  category,
  title,
  clothing,
  loading,
  selectedItem,
  onItemClick,
  onAddClick,
}: ClothingSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-card-foreground mb-3">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {clothing
              .filter((item) => item.category === category)
              .map((item) => {
                const isSelected = selectedItem?.id === item.id;
                // Hide selected items from left side
                if (isSelected) return null;
                return (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    onClick={() => onItemClick(item)}
                    className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:scale-105 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {item.name}
                    <Plus className="w-3 h-3" />
                  </Badge>
                );
              })}
            <button
              onClick={onAddClick}
              className="w-8 h-8 bg-primary/70 hover:bg-primary/80 text-primary-foreground rounded-full shadow-md hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
              aria-label={`Add ${title.toLowerCase()} clothing`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
