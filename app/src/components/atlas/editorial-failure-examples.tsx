import { snapshotObservationSchema } from '@/lib/atlas/company-snapshot';
import { reportedRevenue } from '@/lib/atlas/editorial-specimens';
export function EditorialFailureExamples(){
 const cases=[
  ['Missing private-company finance','No observation supplied; dossier remains readable.'],
  ['Missing currency',snapshotObservationSchema.safeParse({...reportedRevenue,currency:null}).success?'Unexpected acceptance':'Rejected; a number cannot lose its currency.'],
  ['Inverted range',snapshotObservationSchema.safeParse({...reportedRevenue,amountHigh:1}).success?'Unexpected acceptance':'Rejected; upper amount is below lower amount.'],
  ['Parent reporting','Parent scope must stay explicit; evidence and reviewer check establish the actual relationship.'],
  ['Conflicting variants','Keep the battery/fuel-cell distinction and conflicting figures visible; do not select a convenient maximum.'],
  ['Wrong or unavailable logo','Keep the initials fallback until identity is checked; a rank is not approval.'],
  ['Unknown image reuse','Keep the asset private; do not withhold the supported dossier.']
 ];
 return <details className="mx-auto max-w-7xl px-6 py-4"><summary>Synthetic failure cases (not organization findings)</summary><dl className="my-4 grid gap-4 sm:grid-cols-2">{cases.map(([name,result])=><div key={name}><dt className="font-bold">{name}</dt><dd>{result}</dd></div>)}</dl></details>;
}
