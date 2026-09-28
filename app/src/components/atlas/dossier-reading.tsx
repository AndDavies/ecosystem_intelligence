import type { ReactNode } from "react";
import { ArrowRight, BookmarkPlus, ChevronDown, Download, MoreHorizontal } from "lucide-react";
import Link from "@/components/atlas/navigation-link";
import { DownloadLink } from "@/components/atlas/download-link";
import { PublicShare } from "@/components/atlas/public-share";
import { ExternalSourceLink } from "@/components/atlas/internal-link";
import { dossierParagraphs } from "@/lib/atlas/dossier-presentation-copy";
import { publicCitationSourceLocator } from "@/lib/atlas/public-profile-data";
import type { CapabilitySource } from "@/lib/atlas/capability-presentation";
import { formatDate } from "@/lib/utils";
import styles from "./editorial-dossier.module.css";

export function DossierParagraphs({ text, className = "" }: { text: string | null | undefined; className?: string }) {
  const paragraphs = dossierParagraphs(text);
  return paragraphs.length ? <div className={`${styles.paragraphs} ${className}`}>{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : null;
}

export function DossierReadingSection({ id, title, note, children, alias }: { id: string; title: string; note?: string; children: ReactNode; alias?: string }) {
  return <section id={id} tabIndex={-1} className={styles.readingSection} aria-labelledby={`${id}-heading`}>
    <div className={styles.sectionSide}>{alias ? <span id={alias} /> : null}<h2 id={`${id}-heading`}>{title}</h2>{note ? <p>{note}</p> : null}</div>
    <div className={styles.prose}>{children}</div>
  </section>;
}

export function DossierActions({ type, id, slug, ownerSlug, title, description, profilePath, websiteUrl, closing = false }: {
  type: "organization" | "capability"; id: string; slug: string; ownerSlug: string; title: string; description: string; profilePath: string; websiteUrl?: string | null; closing?: boolean;
}) {
  const tools = <>
    {websiteUrl ? <ExternalSourceLink href={websiteUrl} className={styles.mobileWebsite}>Official website</ExternalSourceLink> : null}
    <DownloadLink href={`/api/export?type=${type}-dossier&slug=${slug}`} className="atlas-prose-link inline-flex items-center gap-1">Download profile <Download aria-hidden="true" /></DownloadLink>
    <PublicShare title={title} description={description} path={`/${type === "organization" ? "organizations" : "capabilities"}/${slug}`} className="!border-0 !bg-transparent !px-0 !text-xs !text-[var(--atlas-link)]" />
    <Link href="/collections" prefetch={false} className="atlas-prose-link">My shortlists</Link>
  </>;
  return <div className={styles.actions} aria-label={`${type === "organization" ? "Organization" : "Capability"} actions`}>
    <div className={styles.primaryActions}>
      <Link href={`/collections?addType=${type}&addId=${id}&returnTo=${encodeURIComponent(profilePath)}`} prefetch={false} className="atlas-signal-button gap-2"><BookmarkPlus aria-hidden="true" />Add to shortlist</Link>
      <Link href={`/connect/${ownerSlug}`} prefetch={false} className="atlas-secondary-button">Request an introduction</Link>
      {!closing && websiteUrl ? <ExternalSourceLink href={websiteUrl} className={styles.website}>Official website</ExternalSourceLink> : null}
      {!closing ? <details className={styles.mobileTools}><summary aria-label="More profile actions"><MoreHorizontal className="size-4" aria-hidden="true" /></summary><div className={styles.tools}>{tools}</div></details> : null}
    </div>
    {!closing ? <div className={`${styles.tools} ${styles.desktopTools}`}>{tools}</div> : null}
    {closing ? <Link href={`/submit?submissionType=correction&targetType=${type}&targetId=${id}&returnTo=${encodeURIComponent(profilePath)}`} prefetch={false} className={styles.correction}>Suggest a correction <ArrowRight className="size-3.5" aria-hidden="true" /></Link> : null}
  </div>;
}

export function DossierSourceLibrary({ sources, id = "sources", scope }: { sources: CapabilitySource[]; id?: string; scope: string }) {
  if (!sources.length) return null;
  return <section id={id} tabIndex={-1} className={styles.sources} aria-labelledby={`${id}-heading`}>
    <div className={styles.sectionTop}><h2 id={`${id}-heading`}>Original sources <span className={styles.count}>{sources.length} linked {sources.length === 1 ? "record" : "records"}</span></h2></div>
    <p>{scope} A source count is not a count of independent confirmations.</p>
    <ol id="source-library" className={styles.sourceList}>{sources.slice(0, 4).map((source, index) => <DossierSourceRow key={source.source.sourceUrl} entry={source} index={index} />)}</ol>
    {sources.length > 4 ? <details className={`${styles.disclosure} ${styles.moreSources}`}><summary><ChevronDown aria-hidden="true" />Show {sources.length - 4} more source {sources.length === 5 ? "record" : "records"}</summary><ol start={5}>{sources.slice(4).map((source, index) => <DossierSourceRow key={source.source.sourceUrl} entry={source} index={index + 4} />)}</ol></details> : null}
    <p>Public sources cited · Facts and assessments kept separate · Human review</p>
  </section>;
}

function DossierSourceRow({ entry, index }: { entry: CapabilitySource; index: number }) {
  const { source } = entry;
  return <li className={styles.sourceRow}>
    <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    <div><a href={source.sourceUrl} target="_blank" rel="noreferrer" className={`atlas-prose-link ${styles.sourceTitle}`}>{source.sourceTitle}<span className="sr-only"> (opens in a new tab)</span></a><p className={styles.sourceMeta}>{source.publisher}{source.publishedAt ? ` · ${formatDate(source.publishedAt)}` : ""}</p></div>
    <ExternalSourceLink href={source.sourceUrl} className={styles.sourceOpen}><span>Open</span><span className="sr-only"> original source: {source.sourceTitle}</span></ExternalSourceLink>
    <details className={`${styles.disclosure} ${styles.sourceDetail}`}><summary aria-label={`Source details: ${source.sourceTitle}`}><ChevronDown aria-hidden="true" />Source details</summary>
      <p>Source type: {source.sourceType.replaceAll("_", " ")}</p>
      {entry.evidence.map(({ citation, associations }) => <div key={citation.id} id={`citation-${citation.id}`} tabIndex={-1} className={styles.sourcePassage}>
        <p><strong>Supports:</strong> {associations.join(" · ")}</p>
        {publicCitationSourceLocator(citation.sourceLocator) ? <p><strong>Source location:</strong> {publicCitationSourceLocator(citation.sourceLocator)}</p> : null}
        <blockquote><DossierParagraphs text={citation.excerpt} /></blockquote>
      </div>)}
    </details>
  </li>;
}
