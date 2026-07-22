"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthBaseUrl, googleOAuthQueryParams, safeAuthNextPath } from "@/lib/auth-utils";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const emailLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  next: z.string().trim().optional(),
  captchaToken: z.string().trim().max(4096).optional()
});

function redirectWithMessage(path: string, key: "error" | "success", message: string) {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(message)}`);
}

export async function signInWithGoogle(formData: FormData) {
  if (!hasSupabasePublicEnv()) {
    redirectWithMessage("/sign-in", "error", "Hosted sign-in has not been configured yet.");
  }

  const next = safeAuthNextPath(String(formData.get("next") ?? "").trim() || undefined);
  const baseUrl = getAuthBaseUrl();
  const supabase = await createClient({ writeCookies: true });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "openid email profile",
      queryParams: googleOAuthQueryParams
    }
  });

  if (error || !data.url) {
    redirectWithMessage("/sign-in", "error", error?.message ?? "Google sign-in could not be started.");
  }

  redirect(data.url!);
}

export async function sendEmailSignInLink(formData: FormData) {
  if (!hasSupabasePublicEnv()) {
    redirectWithMessage("/sign-in", "error", "Hosted sign-in has not been configured yet.");
  }

  const parsed = emailLinkSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    next: String(formData.get("next") ?? "").trim() || undefined,
    captchaToken: String(formData.get("captchaToken") ?? "").trim() || undefined
  });

  if (!parsed.success) {
    redirectWithMessage("/sign-in", "error", "Enter a valid email address.");
  }

  const next = safeAuthNextPath(parsed.data!.next);
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  if (captchaRequired && !parsed.data!.captchaToken) {
    redirectWithMessage(
      `/sign-in?next=${encodeURIComponent(next)}`,
      "error",
      "Complete the security check before requesting a sign-in link."
    );
  }

  const baseUrl = getAuthBaseUrl();
  const supabase = await createClient({ writeCookies: true });
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data!.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      captchaToken: parsed.data!.captchaToken
    }
  });

  if (error) {
    redirectWithMessage(`/sign-in?next=${encodeURIComponent(next)}`, "error", "We could not send a sign-in link. Wait a moment and try again.");
  }

  redirectWithMessage(
    `/sign-in?next=${encodeURIComponent(next)}`,
    "success",
    "Check your email for a secure sign-in link. Open it in this browser to continue."
  );
}

export async function signOut() {
  if (hasSupabasePublicEnv()) {
    const supabase = await createClient({ writeCookies: true });
    await supabase.auth.signOut({ scope: "local" });
  }

  redirect("/");
}
