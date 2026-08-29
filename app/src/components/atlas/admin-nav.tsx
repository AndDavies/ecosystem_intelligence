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
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--atlas-border)] bg-white p-2 shadow-[var(--atlas-shadow-soft)]" aria-label="Editorial workspace">
      {items.map((item) => (
        <Link key={item.href} href={item.href} prefetch={false} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-transparent px-3 text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:border-[var(--atlas-border)] hover:bg-[var(--atlas-signal-soft)] hover:text-[var(--atlas-ink)] hover:no-underline">
          <item.icon className="size-4 text-[var(--atlas-ink)]" />{item.label}
        </Link>
      ))}
    </nav>
  );
}
