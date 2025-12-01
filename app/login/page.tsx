"use client";

import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle } from "@/lib/auth-client";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginFormData) => {
    const { error } = await signIn.email({
      email: formData.email,
      password: formData.password,
      callbackURL: "/dashboard",
    });

    if (error) {
      toast.error(error.message || "Invalid email or password");
      console.error(error);
    } else {
      toast.success("Successfully signed in!");
      router.push("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("🔵 [Google Sign-In] Button clicked");
    try {
      console.log("🔵 [Google Sign-In] Showing toast notification");
      toast.info("Redirecting to Google...");

      console.log("🔵 [Google Sign-In] Calling signInWithGoogle()");
      const result = await signInWithGoogle();
      console.log("🔵 [Google Sign-In] Result:", result);

      console.log("✅ [Google Sign-In] Success - should redirect to dashboard");
    } catch (err) {
      console.error("❌ [Google Sign-In] Error caught:", err);
      toast.error("Failed to sign in with Google");
      console.error("❌ [Google Sign-In] Full error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-card-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Sign in to your Wardrobe account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 px-4 rounded-lg border border-border transition shadow-sm"
          >
            <Image src="/google.svg" alt="Google" width={20} height={20} />
            Sign in with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
