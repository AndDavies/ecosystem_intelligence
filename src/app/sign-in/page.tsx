import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentProfile } from "@/lib/auth";
import { signInWithPassword } from "@/lib/actions/auth";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect("/app");
  }

  const params = await searchParams;

  return (
    <main className="page-shell">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-8 md:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[36px] border border-[var(--border)] bg-white/50 p-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <ArrowLeft className="size-4" />
              Back to landing
            </Link>
            <div className="mt-8 space-y-4">
              <div className="inline-flex rounded-2xl bg-[var(--secondary)]/20 p-3">
                <LockKeyhole className="size-5" />
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">Sign in to the internal workspace.</h1>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                Use your email and password to go directly into the Ecosystem Intelligence app.
              </p>
            </div>
          </section>
          <Card className="rounded-[36px]">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>Internal access only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {params.error ? (
                <div className="rounded-3xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
                  {params.error}
                </div>
              ) : null}
              {params.success ? (
                <div className="rounded-3xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 p-4 text-sm text-[var(--primary)]">
                  {params.success}
                </div>
              ) : null}
              <form action={signInWithPassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" name="email" type="email" placeholder="you@company.com" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full">
                  Sign in
                </Button>
              </form>
              <div className="text-sm text-[var(--muted-foreground)]">
                Need an account?{" "}
                <Link href="/create-user" className="font-medium text-[var(--primary)]">
                  Create user
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
