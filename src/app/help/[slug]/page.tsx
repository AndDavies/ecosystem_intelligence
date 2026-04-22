import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpDiagram } from "@/components/help/help-diagram";
import { HelpShell } from "@/components/help/help-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getHelpPage, helpPages } from "@/lib/help-content";

export default async function HelpDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const profile = await requireProfile();
  const { slug } = await params;
  const page = getHelpPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <HelpShell
      profile={profile}
      title={page.title}
      description={page.summary}
      currentSlug={page.slug}
    >
      <div className="space-y-5">
        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>What this page is for</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-[var(--muted-foreground)]">
            {page.purpose}
          </CardContent>
        </Card>

        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Key terms</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 xl:grid-cols-2">
            {page.keyTerms.map((item) => (
              <div key={item.term} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                <div className="font-semibold">{item.term}</div>
                <div className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {item.definition}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {page.diagrams?.map((diagram) => (
          <HelpDiagram
            key={`${page.slug}-${diagram.title}`}
            title={diagram.title}
            description={diagram.description}
            steps={diagram.steps}
          />
        ))}

        <div className="grid gap-5 xl:grid-cols-2">
          {page.sections.map((section) => (
            <Card key={section.title} className="rounded-[32px]">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.body ? (
                  <p className="text-sm leading-7 text-[var(--muted-foreground)]">{section.body}</p>
                ) : null}
                {section.bullets?.length ? (
                  <div className="space-y-2">
                    {section.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="rounded-3xl border border-[var(--border)] bg-white/60 px-4 py-3 text-sm text-[var(--foreground)]"
                      >
                        {bullet}
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-[32px] border-amber-100 bg-amber-50/70">
          <CardHeader>
            <CardTitle>What to watch for</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {page.watchFor.map((item) => (
              <div key={item} className="text-sm leading-6 text-amber-950">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Related pages</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {page.related.map((relatedSlug) => {
              const relatedPage = helpPages.find((item) => item.slug === relatedSlug);

              if (!relatedPage) {
                return null;
              }

              return (
                <Link key={relatedSlug} href={`/help/${relatedSlug}`} className="no-underline">
                  <Badge tone="secondary" className="cursor-pointer">
                    {relatedPage.title}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </HelpShell>
  );
}
