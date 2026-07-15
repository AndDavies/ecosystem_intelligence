import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentProfile } from "@/lib/auth";
import { createUserWithPassword } from "@/lib/actions/auth";

export default async function CreateUserPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
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
                <UserRoundPlus className="size-5" />
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">Create an internal user account.</h1>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                New accounts default to viewer access. Roles can be elevated later in the database.
              </p>
            </div>
          </section>
          <Card className="rounded-[36px]">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl">Create user</CardTitle>
              <CardDescription>Set up an email/password account for internal access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {params.error ? (
                <div className="rounded-3xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
                  {params.error}
                </div>
              ) : null}
              <form action={createUserWithPassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">
                    Full name
                  </label>
                  <Input id="fullName" name="fullName" placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" name="email" type="email" placeholder="you@company.com" required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Input id="password" name="password" type="password" placeholder="Minimum 8 characters" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm password
                    </label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Create user
                </Button>
              </form>
              <div className="text-sm text-[var(--muted-foreground)]">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-[var(--primary)]">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
