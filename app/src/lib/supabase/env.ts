export function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

export function hasSupabasePublicEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublicKey());
}

export function hasSupabaseAdminEnv() {
  return Boolean(hasSupabasePublicEnv() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Legacy alias retained for the internal workspace while it is migrated. New
// public-atlas code should use the explicit public/admin checks above.
export function hasSupabaseEnv() {
  return hasSupabaseAdminEnv();
}

export function hasOpenAiEnv() {
  return Boolean(process.env.OPENAI_API_KEY);
}
