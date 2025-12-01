"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useState, useCallback } from "react";
import { Provider } from "jotai";
import { ProfileSetup, checkUserProfile } from "@/modules/profile-setup";
import { DashboardContent } from "@/modules/profile-setup/components/DashboardContent";

type ProfileStatus = "loading" | "needs-setup" | "complete";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");

  const fetchProfileStatus = useCallback(async () => {
    try {
      const result = await checkUserProfile();
      setProfileStatus(result.hasProfile ? "complete" : "needs-setup");
    } catch {
      // If we can't check, assume we need setup
      setProfileStatus("needs-setup");
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileStatus();
    }
  }, [session?.user?.id, fetchProfileStatus]);

  const handleSetupComplete = () => {
    setProfileStatus("complete");
  };

  // Loading state
  if (isPending || profileStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
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
      </Provider>
    );
  }

  // Profile complete - show dashboard
  return (
    <DashboardContent
      userName={session.user?.name}
      userEmail={session.user?.email}
    />
  );
}
