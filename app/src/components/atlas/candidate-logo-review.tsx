import Image from "next/image";
import { candidateLogoSchema } from "@/lib/research/pipeline-schema";

export function CandidateLogoReview({ candidateId, record }: { candidateId: string; record: unknown }) {
  const value = record && typeof record === "object" && "candidateLogo" in record ? record.candidateLogo : undefined;
  if (!value) return null;
  const parsed = candidateLogoSchema.safeParse(value);
  if (!parsed.success) return <p className="my-4 text-sm">The proposed logo needs correction before publication.</p>;
  const logo = parsed.data;
  if (logo.status === "existing_published") return <p className="my-4 text-sm">Logo: keep the existing published mark.</p>;
  if (logo.status === "not_found") return <p className="my-4 text-sm">Logo: no usable official mark found. The dossier can still be published.</p>;
  return (
    <div className="my-4 flex flex-wrap items-center gap-4 rounded-md border border-[var(--admin-border)] p-3">
      {logo.storagePath ? <div className="flex gap-2" aria-label="Logo preview on light and dark backgrounds">
        {["bg-white", "bg-slate-900"].map((background) => <div key={background} className={`relative h-16 w-28 ${background}`}>
          <Image unoptimized src={`/api/admin/candidate-logo/${candidateId}`} alt="Proposed official logo" fill sizes="112px" className="object-contain p-1" />
        </div>)}
      </div> : null}
      <div className="text-sm">
        <p className="font-semibold">Official logo{logo.status === "review_required" ? " · check the proposed mark" : ""}</p>
        <p>{logo.storagePath ? "Included when you accept and publish this dossier." : "Historical local packet: image has not been staged for publication."}</p>
        <a href={logo.sourcePageUrl} target="_blank" rel="noreferrer" className="underline">Official source</a>
      </div>
    </div>
  );
}
