import Link from "next/link";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Database,
  FolderKanban,
  Layers3,
  LayoutDashboard,
  Search,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import type { ReactNode } from "react";
import type { Profile } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompactGlobalSearch } from "@/components/search/compact-global-search";
import { signOut } from "@/lib/actions/auth";

interface AppShellProps {
  children: ReactNode;
  profile: Profile;
}

export function AppShell({ children, profile }: AppShellProps) {
  const isReviewer = profile.role === "reviewer" || profile.role === "admin";
  const isAdmin = profile.role === "admin";
  const navGroups = [
    {
      label: "Workspace",
      items: [
        { href: "/app", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
        { href: "/app#search", label: "Search", icon: <Search className="size-4" /> },
        { href: "/shortlists", label: "Lists", icon: <ClipboardList className="size-4" /> }
      ]
    },
    {
      label: "Intelligence",
      items: [
        { href: "/use-cases", label: "Use Cases", icon: <FolderKanban className="size-4" /> },
        { href: "/domains", label: "Domains", icon: <Layers3 className="size-4" /> },
        { href: "/companies", label: "Companies", icon: <Building2 className="size-4" /> }
      ]
    },
    {
      label: "Support",
      items: [{ href: "/help", label: "Help", icon: <BookOpen className="size-4" /> }]
    }
  ];

  return (
    <div className="page-shell">
      <div className="flex min-h-screen w-full flex-col xl:grid xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden xl:sticky xl:top-0 xl:flex xl:h-screen xl:flex-col xl:border-r xl:border-white/15 xl:bg-[#05161b] xl:p-4 xl:text-white xl:shadow-[18px_0_60px_rgba(5,22,27,0.18)]">
          <Link href="/app" className="px-3 py-4 no-underline hover:bg-white/10">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center border border-white/25 bg-white/10 text-white">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <div className="font-display text-sm font-semibold uppercase tracking-[0.08em] text-white">
                  Ecosystem Intelligence
                </div>
                <div className="mt-1 text-xs text-white/60">BD intelligence workspace</div>
              </div>
            </div>
          </Link>

          <nav className="mt-5 flex-1 space-y-5 overflow-auto pr-1">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
                  ))}
                </div>
              </div>
            ))}

            {(isReviewer || isAdmin) ? (
              <div className="space-y-2">
                <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  Internal
                </div>
                <div className="space-y-1">
                  {isReviewer ? (
                    <SidebarLink href="/review" icon={<SlidersHorizontal className="size-4" />} label="Review" />
                  ) : null}
                  {isAdmin ? (
                    <>
                      <SidebarLink href="/admin/taxonomy" icon={<Database className="size-4" />} label="Taxonomy" />
                      <SidebarLink href="/admin/enrichment" icon={<BriefcaseBusiness className="size-4" />} label="Enrichment" />
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </nav>

          <div className="mt-5 border border-white/15 bg-white/5 p-3">
            <div className="truncate text-sm font-semibold text-white">{profile.fullName ?? profile.email}</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <Badge tone="surface">{profile.role}</Badge>
              <form action={signOut}>
                <Button variant="surface" type="submit" className="h-9 px-3">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-white/15 bg-[#05161b] px-4 py-3 text-white shadow-[0_12px_36px_rgba(5,22,27,0.24)] xl:hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center border border-white/25 bg-white/10 text-white">
                    <ShieldCheck className="size-4" />
                  </div>
                  <Link
                    href="/app"
                    className="truncate font-display text-base font-semibold uppercase tracking-[0.06em] text-white no-underline hover:text-white"
                  >
                    Ecosystem Intelligence
                  </Link>
                </div>
                <Badge tone="surface" className="shrink-0">{profile.role}</Badge>
              </div>
              <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navGroups.flatMap((group) => group.items).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="shrink-0 border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-white/90 no-underline transition hover:bg-white/15 hover:text-white"
                  >
                    <span className="inline-flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                  </Link>
                ))}
                {isReviewer ? (
                  <Link
                    href="/review"
                    className="shrink-0 border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-white/90 no-underline transition hover:bg-white/15 hover:text-white"
                  >
                    Review
                  </Link>
                ) : null}
                {isAdmin ? (
                  <Link
                    href="/admin/taxonomy"
                    className="shrink-0 border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-white/90 no-underline transition hover:bg-white/15 hover:text-white"
                  >
                    Admin
                  </Link>
                ) : null}
              </nav>
            </div>
          </header>

          <div className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)]/94 px-6 py-3 backdrop-blur-xl xl:flex 2xl:px-8">
            <CompactGlobalSearch />
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/shortlists"
                className="border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--foreground)] no-underline shadow-[0_8px_22px_rgba(5,22,27,0.04)] hover:border-[var(--primary)] hover:bg-[var(--card-muted)]"
              >
                Open Lists
              </Link>
              <Badge tone="surface">{profile.role}</Badge>
            </div>
          </div>

          <main className="flex-1 px-4 py-5 pb-10 md:px-6 xl:px-6 xl:py-6 2xl:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-white/80 no-underline transition hover:bg-white/10 hover:text-white"
    >
      <span className="text-white/50">{icon}</span>
      {label}
    </Link>
  );
}
