import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-[var(--foreground)]" : undefined}>{item.label}</span>
            )}
            {!isLast ? <span className="text-[var(--muted-foreground)]/70">&gt;</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
