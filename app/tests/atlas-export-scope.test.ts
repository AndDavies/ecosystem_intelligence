import {describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
import {atlasExportOrganizationIds} from "@/lib/atlas/repository";
import {atlasTestSnapshot} from "./fixtures/atlas-snapshot";
const snapshot={...atlasTestSnapshot,organizations:Array.from({length:1205},(_,index)=>({...atlasTestSnapshot.organizations[0],id:`org-${index}`,name:`Organization ${String(index).padStart(4,"0")}`}))};
describe("complete atlas export selection",()=>{
  it("exports all filtered matches regardless of interactive page or page size",()=>{
    expect(atlasExportOrganizationIds(snapshot,{region:"atlantic-canada",page:3,pageSize:18})).toHaveLength(1205);
    expect(atlasExportOrganizationIds(snapshot,{region:"ontario"})).toEqual([]);
  });
  it("retains more than 100 explicit selections in requested order and excludes unpublished identities",()=>{
    const ids=snapshot.organizations.slice(0,1105).map(row=>row.id).reverse();
    expect(atlasExportOrganizationIds(snapshot,{},[...ids,"private-id",ids[0]])).toEqual(ids);
  });
});
