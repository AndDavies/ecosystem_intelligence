"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeAuthNextPath } from "@/lib/auth-utils";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const createUserSchema = signInSchema.extend({
  fullName: z.string().trim().min(2),
  confirmPassword: z.string().min(8)
});

const emailLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  next: z.string().trim().optional()
});

function redirectWithMessage(path: string, key: "error" | "success", message: string) {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(message)}`);
}

export async function signInWithGoogle(formData: FormData) {
  if (!hasSupabasePublicEnv()) {
    redirectWithMessage("/sign-in", "error", "Hosted sign-in has not been configured yet.");
  }

  const next = safeAuthNextPath(String(formData.get("next") ?? "").trim() || undefined);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const supabase = await createClient({ writeCookies: true });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "openid email profile"
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
    next: String(formData.get("next") ?? "").trim() || undefined
  });

  if (!parsed.success) {
    redirectWithMessage("/sign-in", "error", "Enter a valid email address.");
  }

  const next = safeAuthNextPath(parsed.data!.next);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const supabase = await createClient({ writeCookies: true });
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data!.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`
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

export async function signInWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/app");
  }

  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? "")
  });

  if (!parsed.success) {
    redirectWithMessage("/sign-in", "error", "Enter a valid email and password.");
  }

  const values = parsed.data!;

  const supabase = await createClient({ writeCookies: true });
  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password
  });

  if (error) {
    redirectWithMessage("/sign-in", "error", error.message);
  }

  redirect("/app");
}

export async function createUserWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/app");
  }

  const parsed = createUserSchema.safeParse({
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? "")
  });

  if (!parsed.success) {
    redirectWithMessage("/create-user", "error", "Complete all fields with valid values.");
  }

  const values = parsed.data!;

  if (values.password !== values.confirmPassword) {
    redirectWithMessage("/create-user", "error", "Passwords do not match.");
  }

  const supabase = await createClient({ writeCookies: true });
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        full_name: values.fullName
      }
    }
  });

  if (error) {
    redirectWithMessage("/create-user", "error", error.message);
  }

  if (data.user) {
    const admin = createAdminClient();
    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email: values.email,
        full_name: values.fullName,
        role: "viewer"
      },
      {
        onConflict: "id"
      }
    );
  }

  if (data.session) {
    redirect("/app");
  }

  redirectWithMessage(
    "/sign-in",
    "success",
    "Account created. Confirm your email if required, then sign in."
  );
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient({ writeCookies: true });
    await supabase.auth.signOut({ scope: "local" });
  }

  redirect("/");
}
