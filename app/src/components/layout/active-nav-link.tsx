"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ActiveNavLink({
  href,
  children,
  className,
  activeClassName,
  activeMode = "section"
}: {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  activeMode?: "exact" | "section" | "none";
}) {
  const pathname = usePathname();
  const targetPath = href.split("#")[0] || href;
  const isActive =
    activeMode === "none"
      ? false
      : activeMode === "exact"
        ? pathname === targetPath
        : pathname === targetPath || pathname.startsWith(`${targetPath}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(className, isActive && activeClassName)}
    >
      {children}
    </Link>
  );
}
