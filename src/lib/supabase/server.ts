import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

type CreateClientOptions = {
  writeCookies?: boolean;
};

export async function createClient(options: CreateClientOptions = {}) {
  const cookieStore = await cookies();
  const writeCookies = options.writeCookies ?? false;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieMutation[]) {
          if (!writeCookies) {
            return;
          }

          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server component reads cannot mutate cookies. Middleware and
              // server actions handle session refresh and auth writes safely.
            }
          });
        }
      }
    }
  );
}
