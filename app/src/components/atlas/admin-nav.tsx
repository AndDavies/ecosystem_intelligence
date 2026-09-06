"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, BookOpenText, Building2, ClipboardCheck, FileInput, Inbox, LayoutDashboard, MailCheck, MessagesSquare, RadioTower, Rss, Send, Waves } from "lucide-react";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/intake", label: "Source intake", icon: FileInput },
  { href: "/admin/review", label: "Review queue", icon: ClipboardCheck },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/publish", label: "Publish", icon: Send },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/demand-signals", label: "Demand signals", icon: Waves },
  { href: "/admin/demand-matches", label: "Demand matches", icon: RadioTower },
  { href: "/admin/briefs", label: "Defence briefs", icon: BookOpenText },
  { href: "/admin/signals", label: "Signals", icon: Rss },
  { href: "/admin/subscribers", label: "Subscribers", icon: MailCheck },
  { href: "/admin/insights", label: "Insights", icon: MessagesSquare },
  { href: "/admin/coverage", label: "Coverage", icon: BarChart3 }
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto border-y border-[var(--atlas-border)] py-2" aria-label="Editorial workspace">
      {items.map((item) => (
        <Link key={item.href} href={item.href} prefetch={false} aria-current={(item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href)) ? "page" : undefined} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[4px] border border-transparent px-3 text-sm font-semibold text-[var(--atlas-ink-soft)] no-underline hover:border-[var(--atlas-border)] hover:bg-[var(--atlas-signal-soft)] hover:text-[var(--atlas-ink)] hover:no-underline aria-[current=page]:border-[var(--atlas-ink)] aria-[current=page]:bg-white aria-[current=page]:text-[var(--atlas-ink)]">
          <item.icon className="size-4 text-[var(--atlas-ink)]" />{item.label}
        </Link>
      ))}
    </nav>
  );
}
