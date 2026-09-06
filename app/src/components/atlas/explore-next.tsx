import { ArrowRight } from "lucide-react";
import { InternalLink } from "@/components/atlas/internal-link";
import { buildExploreNextGroups, type InternalLinkEdge } from "@/lib/atlas/internal-link-graph";

export function ExploreNext({
  links,
  module,
  currentHref,
  eyebrow = "Continue exploring",
  title = "Explore the connected record",
  description = "Follow the strongest reviewed and discovery-led paths without losing the context of this page."
}: {
  links: InternalLinkEdge[];
  module: string;
  currentHref?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const groups = buildExploreNextGroups(links, { currentHref });
  if (!groups.length) return null;
  let position = 0;

  return (
    <section
      className="atlas-explore-next mt-8 rounded-none bg-[var(--atlas-blue-soft)] px-5 py-7 sm:px-8 sm:py-8"
      aria-labelledby={`${module}-explore-next-heading`}
      data-internal-link-module={module}
    >
      <p className="atlas-eyebrow">{eyebrow}</p>
      <h2 id={`${module}-explore-next-heading`} className="mt-2 max-w-[24ch] font-[family-name:var(--font-barlow)] text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)] sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-[72ch] text-sm leading-6 text-[var(--atlas-muted)] sm:text-base sm:leading-7">{description}</p>
      <div className={`mt-7 grid gap-7 ${groups.length === 1 ? "" : groups.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`${module}-${group.key}-heading`}>
            <h3 id={`${module}-${group.key}-heading`} className="text-xs font-extrabold uppercase tracking-[0.09em] text-[var(--atlas-ink)]">{group.title}</h3>
            {group.description ? <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{group.description}</p> : null}
            <ul className="mt-4 divide-y divide-[var(--atlas-border-strong)] border-y border-[var(--atlas-border-strong)]">
              {group.links.map((link) => {
                position += 1;
                return (
                  <li key={link.href} className="py-3 first:pt-0 last:pb-0">
                    <InternalLink link={link} module={module} position={position} variant="plain" className="group flex min-h-11 items-start justify-between gap-3 rounded-[8px] py-2 font-bold text-[var(--atlas-ink)] no-underline hover:no-underline">
                      <span>
                        <span className="block text-sm leading-5 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">{link.label}</span>
                        {link.detail ? <span className="mt-1 block text-xs font-normal leading-5 text-[var(--atlas-muted)]">{link.detail}</span> : null}
                      </span>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-[var(--atlas-primary)]" aria-hidden="true" />
                    </InternalLink>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
