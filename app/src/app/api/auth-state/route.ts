import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const signedOutResponse = NextResponse.json(
    { signedIn: false },
    { headers: { "Cache-Control": "private, no-store" } }
  );
  if (!hasSupabasePublicEnv()) return signedOutResponse;

  try {
    const supabase = await createClient({ writeCookies: true });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error) {
      return NextResponse.json(
        { signedIn: Boolean(user) },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }
  } catch {
    // Expired and already-used refresh tokens are normal stale-client states.
  }

  const cookieStore = await cookies();
  cookieStore.getAll()
    .filter(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"))
    .forEach(({ name }) => signedOutResponse.cookies.delete(name));
  return signedOutResponse;
}
