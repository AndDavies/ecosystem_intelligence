import "server-only";

const verificationEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

export function publicTurnstileConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyPublicTurnstileToken(token: string | null | undefined) {
  const siteKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!siteKeyConfigured && !secret) return process.env.NODE_ENV !== "production";
  if (!siteKeyConfigured || !secret || !token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    const response = await fetch(verificationEndpoint, {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000)
    });
    if (!response.ok) return false;
    const result = await response.json() as TurnstileResponse;
    return result.success === true;
  } catch {
    return false;
  }
}
