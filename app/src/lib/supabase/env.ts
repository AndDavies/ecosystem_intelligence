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

export function hasOpenAiEnv() {
  return Boolean(process.env.OPENAI_API_KEY);
}
