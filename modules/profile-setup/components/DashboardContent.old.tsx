"use client";

import { LogOut, Sparkles, Plus, X, Pencil } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { ClothingDropzone, ClothingDropzoneContent } from "./ClothingDropzone";
import { analyzeClothingImage, uploadClothingImage } from "../api/client";
import { toast } from "sonner";
import type { ClothingAnalysis } from "../types";

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
      // Upload image
      const uploadResult = await uploadClothingImage(uploadFile);
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
      // Upload compressed image
      const uploadResult = await uploadClothingImage(faceFile);
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

            {/* Profile Picture */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile?.profilePic ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-[4px_4px_0px_0px_hsl(var(--primary))]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.profilePic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted border-4 border-border flex items-center justify-center">
                    <span className="text-4xl text-muted-foreground">👤</span>
                  </div>
                )}
                <button
                  onClick={() => setFaceDialogOpen(true)}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary/70 hover:bg-primary/80 text-primary-foreground rounded-full shadow-md hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                  aria-label="Upload face"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="font-bold text-card-foreground">
                  Profile Picture
                </p>
                <p className="text-sm text-muted-foreground">
                  Click + to {profile?.profilePic ? "update" : "add"} your photo
                </p>
              </div>
            </div>

            {/* Profile Data Badges */}
            <div className="flex flex-wrap gap-2">
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : profile ? (
                <>
                  {profile.height && (
                    <Badge
                      variant="secondary"
                      className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] transition-all"
                    >
                      Height: {profile.height} cm
                    </Badge>
                  )}
                  {profile.weight && (
                    <Badge
                      variant="secondary"
                      className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] transition-all"
                    >
                      Weight: {profile.weight} kg
                    </Badge>
                  )}
                  {profile.age && (
                    <Badge
                      variant="secondary"
                      className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] transition-all"
                    >
                      Age: {profile.age}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] transition-all"
                  >
                    Style: {profile.dressingStyle}
                  </Badge>
                  {/* TODO: Implement edit profile functionality */}
                  <button
                    onClick={() => {
                      // TODO: Open edit profile dialog
                      toast.info("Edit profile coming soon!");
                    }}
                    className="w-8 h-8 bg-primary/70 hover:bg-primary/80 text-primary-foreground rounded-full shadow-md hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                    aria-label="Edit profile"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No profile data
                </div>
              )}
            </div>

            {/* HEAD Category */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-3">
                Head
              </h3>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {clothing
                      .filter((item) => item.category === "HEAD")
                      .map((item) => {
                        const isSelected = selectedItems.head?.id === item.id;
                        // Hide selected items from left side
                        if (isSelected) return null;
                        return (
                          <Badge
                            key={item.id}
                            variant="secondary"
                            onClick={() => toggleItemSelection(item)}
                            className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:scale-105 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {item.name}
                            <Plus className="w-3 h-3" />
                          </Badge>
                        );
                      })}
                    <button
                      onClick={() => openAddDialog("HEAD")}
                      className="w-8 h-8 bg-primary/70 hover:bg-primary/80 text-primary-foreground rounded-full shadow-md hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                      aria-label="Add head clothing"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* TOP Category */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-3">
                Top
              </h3>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {clothing
                      .filter((item) => item.category === "TOP")
                      .map((item) => {
                        const isSelected = selectedItems.top?.id === item.id;
                        // Hide selected items from left side
                        if (isSelected) return null;
                        return (
                          <Badge
                            key={item.id}
                            variant="secondary"
                            onClick={() => toggleItemSelection(item)}
                            className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:scale-105 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {item.name}
                            <Plus className="w-3 h-3" />
                          </Badge>
                        );
                      })}
                    <button
                      onClick={() => openAddDialog("TOP")}
                      className="w-8 h-8 bg-primary/70 hover:bg-primary/80 text-primary-foreground rounded-full shadow-md hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                      aria-label="Add top clothing"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* BOTTOM Category */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-3">
                Bottom
              </h3>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {clothing
                      .filter((item) => item.category === "BOTTOM")
                      .map((item) => {
                        const isSelected = selectedItems.bottom?.id === item.id;
                        // Hide selected items from left side
                        if (isSelected) return null;
                        return (
                          <Badge
                            key={item.id}
                            variant="secondary"
                            onClick={() => toggleItemSelection(item)}
                            className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:scale-105 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {item.name}
                            <Plus className="w-3 h-3" />
                          </Badge>
                        );
                      })}
                    <button
                      onClick={() => openAddDialog("BOTTOM")}
                      className="w-8 h-8 bg-primary/70 hover:bg-primary/80 text-primary-foreground rounded-full shadow-md hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                      aria-label="Add bottom clothing"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - AI Generated Photo Card */}
          <div>
            <Card className="rounded-2xl shadow-lg border-2 border-border overflow-hidden">
              <CardHeader className="bg-accent/20">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Generated Outfit
                </CardTitle>
                <CardDescription className="space-y-2">
                  {selectedItems.head ||
                  selectedItems.top ||
                  selectedItems.bottom ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedItems.head && (
                        <Badge
                          variant="secondary"
                          onClick={() =>
                            toggleItemSelection(selectedItems.head!)
                          }
                          className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:scale-105 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {selectedItems.head.name}
                          <X className="w-3 h-3" />
                        </Badge>
                      )}
                      {selectedItems.top && (
                        <Badge
                          variant="secondary"
                          onClick={() =>
                            toggleItemSelection(selectedItems.top!)
                          }
                          className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:scale-105 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {selectedItems.top.name}
                          <X className="w-3 h-3" />
                        </Badge>
                      )}
                      {selectedItems.bottom && (
                        <Badge
                          variant="secondary"
                          onClick={() =>
                            toggleItemSelection(selectedItems.bottom!)
                          }
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
                <div className="aspect-square bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
                      Generate your first outfit
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add clothing items to get started
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Clothing Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card rounded-2xl border-2 border-border shadow-xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-card-foreground">
                Add{" "}
                {dialogCategory === "HEAD"
                  ? "Head"
                  : dialogCategory === "TOP"
                  ? "Top"
                  : "Bottom"}{" "}
                Item
              </DialogTitle>
              
            </DialogHeader>

            <div className="space-y-4">
              <ClothingDropzone
                file={uploadFile}
                preview={uploadPreview}
                analysis={uploadAnalysis}
                isAnalyzing={isAnalyzing}
                error={uploadError}
                onDrop={handleDrop}
                onRemove={handleRemove}
              >
                <ClothingDropzoneContent />
              </ClothingDropzone>

              {/* Action Buttons - Only show when analysis is complete */}
              {uploadAnalysis && !isAnalyzing && (
                <div className="flex gap-3">
                  <button
                    onClick={handleRemove}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 px-4 rounded-xl border-2 border-border transition shadow-sm"
                  >
                    Try Another
                  </button>
                  <button
                    onClick={handleSaveClothing}
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

        {/* Face Upload Dialog */}
        <Dialog open={faceDialogOpen} onOpenChange={setFaceDialogOpen}>
          <DialogContent className="bg-card rounded-2xl border-2 border-border shadow-xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-card-foreground">
                Upload Profile Picture
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <ClothingDropzone
                file={faceFile}
                preview={facePreview}
                analysis={null}
                isAnalyzing={isFaceAnalyzing}
                error={faceError}
                onDrop={handleFaceDrop}
                onRemove={handleFaceRemove}
              >
                {!faceFile ? (
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
                ) : isFaceAnalyzing ? (
                  <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
                    <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="font-semibold text-card-foreground">
                      Verifying your photo...
                    </p>
                  </div>
                ) : faceVerified ? (
                  <div className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-muted shrink-0 border-2 border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={facePreview || ""}
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
              {faceVerified && !isFaceAnalyzing && (
                <div className="flex gap-3">
                  <button
                    onClick={handleFaceRemove}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 px-4 rounded-xl border-2 border-border transition shadow-sm"
                  >
                    Try Another
                  </button>
                  <button
                    onClick={handleSaveFace}
                    disabled={isSavingFace}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingFace ? "Saving..." : "Save Photo"}
                  </button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
