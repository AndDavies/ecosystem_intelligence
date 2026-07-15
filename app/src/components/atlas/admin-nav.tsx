import Link from "next/link";
import { BarChart3, ClipboardCheck, FileInput, LayoutDashboard } from "lucide-react";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/intake", label: "Source intake", icon: FileInput },
  { href: "/admin/review", label: "Review queue", icon: ClipboardCheck },
  { href: "/admin/coverage", label: "Coverage", icon: BarChart3 }
];

export function AdminNav() {
  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Editorial workspace">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-semibold text-[#344054] no-underline hover:border-[#98a2b3] hover:bg-[#f8fafc] hover:no-underline">
          <item.icon className="size-4 text-[#0756d9]" />{item.label}
        </Link>
      ))}
    </nav>
  );
}
