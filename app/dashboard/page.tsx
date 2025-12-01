"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-card-foreground">Wardrobe Dashboard</h1>
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
        {/* Welcome Card */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground">
                Welcome back, {session.user?.name || "User"}!
              </h2>
              <p className="text-muted-foreground">{session.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">Total Items</h3>
            <p className="text-3xl font-bold text-card-foreground mt-2">0</p>
            <p className="text-sm text-muted-foreground mt-1">No items yet</p>
          </div>

          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">Categories</h3>
            <p className="text-3xl font-bold text-card-foreground mt-2">0</p>
            <p className="text-sm text-muted-foreground mt-1">Start organizing</p>
          </div>

          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">Outfits</h3>
            <p className="text-3xl font-bold text-card-foreground mt-2">0</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first outfit</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition text-center">
              <div className="text-3xl mb-2">👕</div>
              <p className="font-medium text-card-foreground">Add Clothing</p>
            </button>

            <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition text-center">
              <div className="text-3xl mb-2">📁</div>
              <p className="font-medium text-card-foreground">Create Category</p>
            </button>

            <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition text-center">
              <div className="text-3xl mb-2">✨</div>
              <p className="font-medium text-card-foreground">New Outfit</p>
            </button>

            <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="font-medium text-card-foreground">View Analytics</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
