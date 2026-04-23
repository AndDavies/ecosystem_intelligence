import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { Profile } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

interface AppShellProps {
  children: ReactNode;
  profile: Profile;
}

export function AppShell({ children, profile }: AppShellProps) {
  const isReviewer = profile.role === "reviewer" || profile.role === "admin";
  const isAdmin = profile.role === "admin";
  const navItems = [
    { href: "/app", label: "Home" },
    { href: "/use-cases", label: "Use Cases" },
    { href: "/domains", label: "Domains" },
    { href: "/companies", label: "Companies" },
    { href: "/help", label: "Help" },
    {
      href: "/app#search",
      label: "Search",
      icon: <Search className="size-4" />
    }
  ];

  return (
    <div className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[92rem] flex-col px-5 py-6 md:px-8">
        <header className="glass-panel sticky top-4 z-10 mb-8 rounded-[34px] px-5 py-5 md:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="workspace-kicker">
                <ShieldCheck className="size-3.5" />
                High-trust intelligence workspace
              </div>
              <div className="space-y-1">
                <Link
                  href="/app"
                  className="font-display text-2xl font-semibold text-[var(--foreground)] no-underline hover:text-[var(--primary)]"
                >
                  Ecosystem Intelligence
                </Link>
                <div className="max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Move between discovery, evidence, and review without losing the capability context behind each decision.
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 xl:min-w-[28rem] xl:items-end">
              <nav className="flex flex-wrap items-center gap-2 rounded-full border border-[var(--border)] bg-white/65 p-2 shadow-[0_12px_30px_rgba(20,34,24,0.05)]">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3 py-2 text-sm font-medium text-[var(--foreground)] no-underline transition hover:bg-white hover:text-[var(--primary)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      {item.icon ?? null}
                      {item.label}
                    </span>
                  </Link>
                ))}
                {isReviewer ? (
                  <Link
                    href="/review"
                    className="rounded-full px-3 py-2 text-sm font-medium text-[var(--foreground)] no-underline transition hover:bg-white hover:text-[var(--primary)]"
                  >
                    Review
                  </Link>
                ) : null}
                {isAdmin ? (
                  <Link
                    href="/admin/taxonomy"
                    className="rounded-full px-3 py-2 text-sm font-medium text-[var(--foreground)] no-underline transition hover:bg-white hover:text-[var(--primary)]"
                  >
                    Admin
                  </Link>
                ) : null}
              </nav>
              <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-[var(--border)] bg-white/62 px-4 py-3 shadow-[0_10px_24px_rgba(20,34,24,0.05)]">
                <div className="text-right">
                  <div className="text-sm font-semibold">{profile.fullName ?? profile.email}</div>
                  <div className="mt-1 flex justify-end">
                    <Badge tone="surface">{profile.role}</Badge>
                  </div>
                </div>
                <form action={signOut}>
                  <Button variant="surface" type="submit">
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
