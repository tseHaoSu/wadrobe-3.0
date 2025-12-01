"use client";

import { Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserProfile {
  height: number | null;
  weight: number | null;
  age: number | null;
  dressingStyle: string;
  profilePic: string | null;
}

interface ProfileSectionProps {
  profile: UserProfile | null;
  loading: boolean;
  onUploadFace: () => void;
}

export function ProfileSection({
  profile,
  loading,
  onUploadFace,
}: ProfileSectionProps) {
  return (
    <>
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
            onClick={onUploadFace}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary/70 hover:bg-primary/80 text-primary-foreground rounded-full shadow-md hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
            aria-label="Upload face"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div>
          <p className="font-bold text-card-foreground">Profile Picture</p>
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
          <div className="text-muted-foreground text-sm">No profile data</div>
        )}
      </div>
    </>
  );
}
