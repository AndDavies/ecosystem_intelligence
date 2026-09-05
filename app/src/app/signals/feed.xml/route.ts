import { getPublishedSignals } from "@/lib/atlas/signals";
import { buildDefenceSignalAlertDescription, defenceSignalAlertTopics } from "@/lib/email/defence-signal-alerts";
import { signalEditionExcerpt } from "@/lib/signals/presentation";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 300;

function xml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export async function GET() {
  const editions = (await getPublishedSignals(20)).filter((edition) => !edition.isLocalPreview);
  const latest = editions[0];
  const items = editions.map((edition) => {
    const url = absoluteUrl(`/signals/${edition.slug}`);
    const topics = defenceSignalAlertTopics(edition.items);
    const principalLimit = edition.summarySections?.limitation ?? null;
    const description = buildDefenceSignalAlertDescription({ executiveSummary: signalEditionExcerpt(edition), topics, principalLimit });
    const enclosure = edition.heroImage ? `<enclosure url="${xml(edition.heroImage.url)}" type="image/${edition.heroImage.url.toLowerCase().endsWith(".webp") ? "webp" : "jpeg"}" />` : "";
    const categories = topics.map((topic) => `<category>${xml(topic)}</category>`).join("");
    return `<item><title>${xml(edition.title)}</title><link>${xml(url)}</link><guid isPermaLink="true">${xml(url)}</guid><pubDate>${new Date(edition.publishedAt).toUTCString()}</pubDate><description>${xml(description)}</description>${categories}${enclosure}</item>`;
  }).join("");
  const document = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${xml(siteName)} Canadian Defence Signals</title><link>${xml(absoluteUrl("/signals"))}</link><description>Source-linked Canadian defence developments and what they may change.</description><language>en-ca</language><lastBuildDate>${new Date(latest?.updatedAt ?? Date.now()).toUTCString()}</lastBuildDate><atom:link href="${xml(absoluteUrl("/signals/feed.xml"))}" rel="self" type="application/rss+xml"/><atom:link href="${xml(absoluteUrl("/north-signal"))}" rel="related" title="North Signal weekly newsletter"/><image><url>${xml(absoluteUrl("/brand/true-north-map-social-avatar.png"))}</url><title>${xml(siteName)} Canadian Defence Signals</title><link>${xml(absoluteUrl("/signals"))}</link></image><copyright>True North Map</copyright><category>Canadian defence</category><managingEditor>andrew@truenorthmap.ca (Andrew Davies)</managingEditor>${items}</channel></rss>`;
  return new Response(document, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
