"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { analyzeClothingImage, uploadClothingImage, uploadProfileImage } from "@/modules/profile-setup/api/client";
import { toast } from "sonner";
import type { ClothingAnalysis } from "@/modules/profile-setup/types";
import { ProfileSection } from "./ProfileSection";
import { ClothingSection } from "./ClothingSection";
import { OutfitCard } from "./OutfitCard";
import { AddClothingDialog } from "./AddClothingDialog";
import { FaceUploadDialog } from "./FaceUploadDialog";

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

export function DashboardContent() {
  const router = useRouter();
  const [clothing, setClothing] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedItems, setSelectedItems] = useState<{
    head?: ClothingItem;
    top?: ClothingItem;
    bottom?: ClothingItem;
  }>({});

  // Add clothing dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCategory, setDialogCategory] = useState<
    "HEAD" | "TOP" | "BOTTOM"
  >("TOP");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadAnalysis, setUploadAnalysis] = useState<ClothingAnalysis | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Face upload dialog state
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [isFaceAnalyzing, setIsFaceAnalyzing] = useState(false);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);
  const [isSavingFace, setIsSavingFace] = useState(false);

  const toggleItemSelection = (item: ClothingItem) => {
    const category = item.category.toLowerCase() as "head" | "top" | "bottom";

    setSelectedItems((prev) => {
      // If item is already selected, deselect it
      if (prev[category]?.id === item.id) {
        const newState = { ...prev };
        delete newState[category];
        return newState;
      }
      // Otherwise, select it
      return {
        ...prev,
        [category]: item,
      };
    });
  };

  useEffect(() => {
    // Fetch clothing items and profile
    const fetchData = async () => {
      try {
        // Fetch clothing
        const clothingResponse = await fetch("/api/clothing");
        const clothingData = await clothingResponse.json();

        if (clothingResponse.ok) {
          setClothing(clothingData.clothing || []);
        } else if (clothingData.shouldClearSession) {
          // User doesn't exist, redirect to home
          router.push("/");
          return;
        }

        // Fetch profile
        const profileResponse = await fetch("/api/user/profile");
        const profileData = await profileResponse.json();

        if (profileResponse.ok && profileData.profile) {
          setProfile(profileData.profile);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const openAddDialog = (category: "HEAD" | "TOP" | "BOTTOM") => {
    setDialogCategory(category);
    setDialogOpen(true);
    // Reset state
    setUploadFile(null);
    setUploadPreview(null);
    setUploadAnalysis(null);
    setUploadError(null);
  };

  const handleDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadError(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeClothingImage(file, dialogCategory);

      if (!result.success) {
        setUploadError(result.error || "Failed to analyze image");
        setUploadAnalysis(null);
      } else if (result.analysis) {
        setUploadAnalysis(result.analysis);
      }
    } catch (error) {
      setUploadError("Failed to analyze image");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemove = () => {
    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }
    setUploadFile(null);
    setUploadPreview(null);
    setUploadAnalysis(null);
    setUploadError(null);
  };

  const handleSaveClothing = async () => {
    if (!uploadFile || !uploadAnalysis) return;

    setIsSaving(true);
    try {
      // Upload image with category
      const uploadResult = await uploadClothingImage(
        uploadFile,
        uploadAnalysis.category
      );
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || "Failed to upload image");
      }

      // Save to database
      const response = await fetch("/api/clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadAnalysis.name,
          description: uploadAnalysis.description,
          category: uploadAnalysis.category,
          color: uploadAnalysis.color,
          brand: uploadAnalysis.brand,
          imageUrl: uploadResult.url,
        }),
      });

      if (!response.ok) throw new Error("Failed to save clothing");

      toast.success("Clothing item added!");
      setDialogOpen(false);

      // Refresh clothing list
      const updatedResponse = await fetch("/api/clothing");
      if (updatedResponse.ok) {
        const data = await updatedResponse.json();
        setClothing(data.clothing || []);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFaceDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setFaceFile(file);
    setFacePreview(URL.createObjectURL(file));
    setFaceError(null);
    setFaceVerified(false);
    setIsFaceAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/face/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setFaceError(result.error || "Failed to verify face");
        setFaceVerified(false);
      } else {
        setFaceVerified(true);
      }
    } catch {
      setFaceError("Failed to verify face");
      setFaceVerified(false);
    } finally {
      setIsFaceAnalyzing(false);
    }
  };

  const handleFaceRemove = () => {
    if (facePreview) {
      URL.revokeObjectURL(facePreview);
    }
    setFaceFile(null);
    setFacePreview(null);
    setFaceVerified(false);
    setFaceError(null);
  };

  const handleSaveFace = async () => {
    if (!faceFile || !faceVerified) return;

    setIsSavingFace(true);
    try {
      // Upload profile image
      const uploadResult = await uploadProfileImage(faceFile);
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || "Failed to upload image");
      }

      // Update profile with face image
      const response = await fetch("/api/face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profilePic: uploadResult.url,
        }),
      });

      if (!response.ok) throw new Error("Failed to save profile picture");

      toast.success("Profile picture updated!");
      setFaceDialogOpen(false);

      // Refresh profile
      const profileResponse = await fetch("/api/user/profile");
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfile(data.profile);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save";
      toast.error(message);
    } finally {
      setIsSavingFace(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-card-foreground">
              My Wardrobe
            </h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Clothing Display */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-card-foreground">My Data</h2>

            <ProfileSection
              profile={profile}
              loading={loading}
              onUploadFace={() => setFaceDialogOpen(true)}
            />

            <ClothingSection
              category="HEAD"
              title="Head"
              clothing={clothing}
              loading={loading}
              selectedItem={selectedItems.head}
              onItemClick={toggleItemSelection}
              onAddClick={() => openAddDialog("HEAD")}
            />

            <ClothingSection
              category="TOP"
              title="Top"
              clothing={clothing}
              loading={loading}
              selectedItem={selectedItems.top}
              onItemClick={toggleItemSelection}
              onAddClick={() => openAddDialog("TOP")}
            />

            <ClothingSection
              category="BOTTOM"
              title="Bottom"
              clothing={clothing}
              loading={loading}
              selectedItem={selectedItems.bottom}
              onItemClick={toggleItemSelection}
              onAddClick={() => openAddDialog("BOTTOM")}
            />
          </div>

          {/* Right Side - AI Generated Photo Card */}
          <div>
            <OutfitCard
              selectedItems={selectedItems}
              profilePicUrl={profile?.profilePic || null}
              userProfile={profile}
              onRemoveItem={toggleItemSelection}
            />
          </div>
        </div>

        {/* Add Clothing Dialog */}
        <AddClothingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={dialogCategory}
          file={uploadFile}
          preview={uploadPreview}
          analysis={uploadAnalysis}
          isAnalyzing={isAnalyzing}
          error={uploadError}
          isSaving={isSaving}
          onDrop={handleDrop}
          onRemove={handleRemove}
          onSave={handleSaveClothing}
        />

        {/* Face Upload Dialog */}
        <FaceUploadDialog
          open={faceDialogOpen}
          onOpenChange={setFaceDialogOpen}
          file={faceFile}
          preview={facePreview}
          isAnalyzing={isFaceAnalyzing}
          error={faceError}
          verified={faceVerified}
          isSaving={isSavingFace}
          onDrop={handleFaceDrop}
          onRemove={handleFaceRemove}
          onSave={handleSaveFace}
        />
      </main>
    </div>
  );
}
