"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const createUserSchema = signInSchema.extend({
  fullName: z.string().trim().min(2),
  confirmPassword: z.string().min(8)
});

function redirectWithMessage(path: string, key: "error" | "success", message: string) {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
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
    await supabase.auth.signOut();
  }

  redirect("/");
}
