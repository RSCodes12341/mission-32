"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/dashboard",
    });
  } catch (err) {
    // A successful sign-in redirects by throwing NEXT_REDIRECT, which is not an
    // AuthError — rethrowing lets Next complete the navigation.
    if (err instanceof AuthError) {
      return { error: "Wrong email or password" };
    }
    throw err;
  }

  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
