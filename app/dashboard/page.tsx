"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Provider } from "jotai";
import { ProfileSetup, checkUserProfile } from "@/modules/profile-setup";
import { DashboardContent } from "@/modules/dashboard";
import { AudioPlayer } from "@/components/AudioPlayer";

type ProfileStatus = "loading" | "needs-setup" | "complete";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");

  useEffect(() => {
    if (!session?.user?.id) return;

    let isMounted = true;

    const fetchProfileStatus = async () => {
      try {
        const result = await checkUserProfile();
        if (isMounted) {
          setProfileStatus(result.hasProfile ? "complete" : "needs-setup");
        }
      } catch (error) {
        console.error("Profile check error:", error);
        // If profile check fails, user might not exist - redirect to home
        if (isMounted) {
          router.push("/");
        }
      }
    };

    fetchProfileStatus();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, router]);

  const handleSetupComplete = () => {
    setProfileStatus("complete");
  };

  // Loading state
  if (isPending || profileStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return null;
  }

  // Needs profile setup
  if (profileStatus === "needs-setup") {
    return (
      <Provider>
        <ProfileSetup onComplete={handleSetupComplete} />
        <AudioPlayer />
      </Provider>
    );
  }

  // Profile complete - show dashboard
  return (
    <>
      <DashboardContent />
      <AudioPlayer />
    </>
  );
}
