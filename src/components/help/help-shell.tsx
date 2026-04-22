import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/types/domain";
import { helpPages } from "@/lib/help-content";
import { cn } from "@/lib/utils";

interface HelpShellProps {
  children: ReactNode;
  profile: Profile;
  title: string;
  description: string;
  currentSlug?: string;
}

export function HelpShell({
  children,
  profile,
  title,
  description,
  currentSlug
}: HelpShellProps) {
  const breadcrumbs = [
    { label: "Home", href: "/app" },
    { label: "Help", href: "/help" },
    ...(currentSlug
      ? [{ label: helpPages.find((page) => page.slug === currentSlug)?.title ?? title }]
      : [])
  ];

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        backHref="/app"
        backLabel="Back to Home"
      />
      <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="space-y-5">
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Help Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <NavLink href="/help" label="Start Here" active={!currentSlug} />
              {helpPages.map((page) => (
                <NavLink
                  key={page.slug}
                  href={`/help/${page.slug}`}
                  label={page.title}
                  description={page.summary}
                  active={currentSlug === page.slug}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-sky-100 bg-sky-50/70">
            <CardContent className="space-y-3 pt-6">
              <div className="text-sm font-semibold text-sky-950">Trust boundary</div>
              <p className="text-sm leading-6 text-sky-900">
                Use help content to understand the workflow, but still rely on citations, provenance,
                and the review model when making decisions in the live dataset.
              </p>
              <Link href="/help/trust-and-review" className="text-sm font-medium">
                Open trust and review guide
              </Link>
            </CardContent>
          </Card>
        </aside>
        <div>{children}</div>
      </div>
    </AppShell>
  );
}

function NavLink({
  href,
  label,
  description,
  active
}: {
  href: string;
  label: string;
  description?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-3xl border px-4 py-3 no-underline transition",
        active
          ? "border-[var(--primary)]/20 bg-[var(--primary)]/8"
          : "border-[var(--border)] bg-white/60 hover:border-[var(--primary)]/20 hover:bg-white"
      )}
    >
      <div className="font-medium text-[var(--foreground)]">{label}</div>
      {description ? (
        <div className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</div>
      ) : null}
    </Link>
  );
}
