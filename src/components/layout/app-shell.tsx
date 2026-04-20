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

  return (
    <div className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 md:px-8">
        <header className="glass-panel sticky top-4 z-10 mb-8 flex flex-col gap-4 rounded-[28px] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Link href="/app" className="text-lg font-semibold text-[var(--foreground)] no-underline hover:text-[var(--primary)]">
              Ecosystem Intelligence
            </Link>
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <ShieldCheck className="size-4" />
              Internal capability discovery workspace
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/app" className="rounded-full px-3 py-2 text-sm text-[var(--foreground)] no-underline hover:bg-white/60 hover:text-[var(--primary)]">
              Home
            </Link>
            <Link href="/use-cases" className="rounded-full px-3 py-2 text-sm text-[var(--foreground)] no-underline hover:bg-white/60 hover:text-[var(--primary)]">
              Use Cases
            </Link>
            <Link href="/app#search" className="rounded-full px-3 py-2 text-sm text-[var(--foreground)] no-underline hover:bg-white/60 hover:text-[var(--primary)]">
              <span className="inline-flex items-center gap-2">
                <Search className="size-4" />
                Search
              </span>
            </Link>
            {isReviewer ? (
              <Link href="/review" className="rounded-full px-3 py-2 text-sm text-[var(--foreground)] no-underline hover:bg-white/60 hover:text-[var(--primary)]">
                Review
              </Link>
            ) : null}
            {isAdmin ? (
              <Link href="/admin/taxonomy" className="rounded-full px-3 py-2 text-sm text-[var(--foreground)] no-underline hover:bg-white/60 hover:text-[var(--primary)]">
                Admin
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{profile.fullName ?? profile.email}</div>
              <Badge tone="secondary">{profile.role}</Badge>
            </div>
            <form action={signOut}>
              <Button variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
