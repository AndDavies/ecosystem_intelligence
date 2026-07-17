import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/collections";
  return value;
}

export async function GET(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient({ writeCookies: true });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("error", "Sign-in could not be completed. Please try again in the same browser.");
      signInUrl.searchParams.set("next", next);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
