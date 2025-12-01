import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

export const signInWithGoogle = async () => {
  console.log("🟢 [auth-client] signInWithGoogle called");
  console.log("🟢 [auth-client] authClient:", authClient);
  console.log("🟢 [auth-client] Calling authClient.signIn.social with:", {
    provider: "google",
    callbackURL: "/dashboard",
  });

  try {
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    console.log("🟢 [auth-client] Social sign-in result:", result);
    return result;
  } catch (error) {
    console.error("🔴 [auth-client] Social sign-in error:", error);
    throw error;
  }
};
