import {beforeEach,describe,expect,it,vi} from 'vitest';
const rpc=vi.hoisted(()=>vi.fn());
vi.mock('server-only',()=>({}));
vi.mock('@/lib/supabase/public',()=>({createPublicClient:()=>({rpc})}));
beforeEach(()=>{vi.resetModules();rpc.mockReset();});
describe('additive migration capability gate',()=>{
 it('fails closed on the old schema and makes no additive-column request',async()=>{
  rpc.mockResolvedValue({data:null,error:{code:'PGRST202'}});
  const {dossierPresentationCopyAvailable}=await import('@/lib/atlas/presentation-copy-support');
  expect(await dossierPresentationCopyAvailable()).toBe(false);
  expect(await dossierPresentationCopyAvailable()).toBe(false);
  expect(rpc.mock.calls).toEqual([['dossier_presentation_copy_ready']]);
 });
 it('advertises supported fields after migration and caches the probe',async()=>{
  rpc.mockResolvedValue({data:true,error:null});
  const {dossierPresentationCopyAvailable}=await import('@/lib/atlas/presentation-copy-support');
  expect(await dossierPresentationCopyAvailable()).toBe(true);
  expect(await dossierPresentationCopyAvailable()).toBe(true);
  expect(rpc).toHaveBeenCalledTimes(1);
 });
 it('does not advertise on a provider failure',async()=>{
  rpc.mockRejectedValue(new Error('connection unavailable'));
  const {dossierPresentationCopyAvailable}=await import('@/lib/atlas/presentation-copy-support');
  expect(await dossierPresentationCopyAvailable()).toBe(false);
 });
});
