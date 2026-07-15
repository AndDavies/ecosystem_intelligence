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
import { ActiveNavLink } from "@/components/layout/active-nav-link";
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
        { href: "/app", label: "Start Here", icon: <LayoutDashboard className="size-4" />, activeMode: "exact" as const },
        { href: "/app#search", label: "Search", icon: <Search className="size-4" />, activeMode: "none" as const },
        { href: "/shortlists", label: "Working Lists", icon: <ClipboardList className="size-4" />, activeMode: "section" as const }
      ]
    },
    {
      label: "Intelligence",
      items: [
        { href: "/use-cases", label: "Mission Areas", icon: <FolderKanban className="size-4" />, activeMode: "section" as const },
        { href: "/domains", label: "Technical Domains", icon: <Layers3 className="size-4" />, activeMode: "section" as const },
        { href: "/companies", label: "Companies", icon: <Building2 className="size-4" />, activeMode: "section" as const }
      ]
    },
    {
      label: "Support",
      items: [{ href: "/help", label: "Help", icon: <BookOpen className="size-4" />, activeMode: "section" as const }]
    }
  ];

  return (
    <div className="page-shell">
      <div className="flex min-h-screen w-full flex-col xl:grid xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden xl:sticky xl:top-0 xl:flex xl:h-screen xl:flex-col xl:border-r xl:border-white/15 xl:bg-[#05161b] xl:p-3 xl:text-white xl:shadow-[18px_0_60px_rgba(5,22,27,0.18)]">
          <Link href="/app" className="px-3 py-3 no-underline hover:bg-white/10">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center border border-white/25 bg-white/10 text-white">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <div className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-white">
                  Ecosystem Intelligence
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">BD workspace</div>
              </div>
            </div>
          </Link>

          <nav className="mt-4 flex-1 space-y-4 overflow-auto pr-1">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarLink key={item.href} href={item.href} icon={item.icon} label={item.label} activeMode={item.activeMode} />
                  ))}
                </div>
              </div>
            ))}

            {(isReviewer || isAdmin) ? (
              <div className="space-y-2">
                <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Internal
                </div>
                <div className="space-y-1">
                  {isReviewer ? (
                    <SidebarLink href="/review" icon={<SlidersHorizontal className="size-4" />} label="Review" activeMode="section" />
                  ) : null}
                  {isAdmin ? (
                    <>
                      <SidebarLink href="/admin/taxonomy" icon={<Database className="size-4" />} label="Taxonomy" activeMode="section" />
                      <SidebarLink href="/admin/enrichment" icon={<BriefcaseBusiness className="size-4" />} label="Enrichment" activeMode="section" />
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </nav>

          <div className="mt-4 border border-white/15 bg-white/5 p-3">
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
          <header className="sticky top-0 z-40 border-b border-white/15 bg-[#05161b] px-4 py-2.5 text-white shadow-[0_10px_28px_rgba(5,22,27,0.2)] xl:hidden">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center border border-white/25 bg-white/10 text-white">
                    <ShieldCheck className="size-4" />
                  </div>
                  <Link
                    href="/app"
                    className="truncate font-display text-sm font-semibold uppercase tracking-[0.06em] text-white no-underline hover:text-white"
                  >
                    Ecosystem Intelligence
                  </Link>
                </div>
                <Badge tone="surface" className="shrink-0">{profile.role}</Badge>
              </div>
              <nav className="-mx-1 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navGroups.flatMap((group) => group.items).map((item) => (
                  <ActiveNavLink
                    key={item.href}
                    href={item.href}
                    activeMode={item.activeMode}
                    className="shrink-0 border border-white/15 bg-transparent px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/70 no-underline transition hover:bg-white/10 hover:text-white"
                    activeClassName="border-white/30 bg-white/15 text-white"
                  >
                    {item.label}
                  </ActiveNavLink>
                ))}
                {isReviewer ? (
                  <ActiveNavLink
                    href="/review"
                    className="shrink-0 border border-white/15 bg-transparent px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/70 no-underline transition hover:bg-white/10 hover:text-white"
                    activeClassName="border-white/30 bg-white/15 text-white"
                  >
                    Review
                  </ActiveNavLink>
                ) : null}
                {isAdmin ? (
                  <ActiveNavLink
                    href="/admin/taxonomy"
                    className="shrink-0 border border-white/15 bg-transparent px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/70 no-underline transition hover:bg-white/10 hover:text-white"
                    activeClassName="border-white/30 bg-white/15 text-white"
                  >
                    Admin
                  </ActiveNavLink>
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
                Open Working Lists
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
  label,
  activeMode = "section"
}: {
  href: string;
  icon: ReactNode;
  label: string;
  activeMode?: "exact" | "section" | "none";
}) {
  return (
    <ActiveNavLink
      href={href}
      activeMode={activeMode}
      className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm font-semibold text-white/70 no-underline transition hover:bg-white/10 hover:text-white"
      activeClassName="border-[var(--secondary)] bg-white/10 text-white"
    >
      <span className="text-white/45">{icon}</span>
      {label}
    </ActiveNavLink>
  );
}
