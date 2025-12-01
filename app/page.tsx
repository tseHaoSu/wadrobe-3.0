import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center max-w-4xl">
          {/* Hero Title with visible shadow */}
          <div className="mb-8 inline-block">
            <h1 className="text-6xl font-bold text-foreground mb-2">
              Welcome to <span className="text-primary">Wardrobe</span>
            </h1>
          </div>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Organize your clothing, plan your outfits, and manage your style
            effortlessly. Your personal wardrobe assistant is here.
          </p>

          {/* CTA Buttons with prominent shadows */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link
              href="/signup"
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all text-lg shadow-lg border-2 border-border hover:shadow-xl hover:translate-y-[-2px]"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-lg border-2 border-border transition-all text-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
