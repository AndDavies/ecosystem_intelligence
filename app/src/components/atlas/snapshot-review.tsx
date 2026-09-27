import { formatSnapshotValue, snapshotLabels, type SnapshotObservation } from '@/lib/atlas/company-snapshot';
import { ExternalSourceLink } from '@/components/atlas/internal-link';
export function SnapshotReview({observations}:{observations:SnapshotObservation[]}) {
 if(!observations.length) return null;
 return <section className="my-4 rounded-md border p-4"><h3 className="font-bold">Proposed snapshot observations</h3><p className="mt-2 text-sm">Check reporting entity, period and qualifications against the mapped evidence. This is proposed content, not an accepted or published fact.</p><dl className="mt-4 space-y-5">{observations.map(item=><div key={item.id}><dt className="font-semibold">{snapshotLabels[item.metric]} · {item.basis}</dt><dd><p>{formatSnapshotValue(item)}</p><p>{item.scopeRelation}: {item.subjectName} · {item.reportingScope}</p><p>{item.period} · {item.asOf}</p><p>{item.qualification}</p><ExternalSourceLink href={item.sourceUrl}>Source: {item.sourceLocator}</ExternalSourceLink></dd></div>)}</dl></section>;
}
