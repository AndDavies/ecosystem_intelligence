import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { safeAuthNextPath } from "@/lib/auth-utils";

export async function GET(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const requestUrl = new URL(request.url);
  const providerError = requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code");
  const next = safeAuthNextPath(requestUrl.searchParams.get("next") ?? undefined);

  if (providerError) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("error", "Google sign-in was cancelled or could not be completed. You can try again or use a secure email link.");
    signInUrl.searchParams.set("next", next);
    return NextResponse.redirect(signInUrl);
  }

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
