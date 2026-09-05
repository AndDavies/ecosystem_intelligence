import { describe, expect, it } from "vitest";
import { bingHealthRows, parseBingDate, publicPath, rankOpportunity, validAiReport, validIntelligence } from "../src/lib/visibility/intelligence";
import { validProductSummary } from "../src/lib/visibility/product-summary";

const report = { provider:"google-ai",collectedAt:"2026-09-05T12:00:00.000Z",period:{startDate:"2026-08-07",endDate:"2026-09-03",timeZone:"America/Los_Angeles"},metric:"impressions",total:366,clicks:null,rows:[{path:"/organizations/example",value:4,variants:2}],dimensions:[],coverage:"complete",sourceUrl:"https://search.google.com/search-console" };
describe("visibility intelligence evidence boundaries",()=>{
  it("keeps Google impressions and Bing citations distinct and never invents clicks",()=>{
    expect(validAiReport(report)).toBe(true);
    expect(validAiReport({...report,clicks:0})).toBe(false);
    expect(validAiReport({...report,provider:"bing-ai"})).toBe(false);
    expect(validAiReport({...report,period:{...report.period,startDate:"2026-09-04"}})).toBe(false);
  });
  it("rejects private paths and unknown fields, canonicalizes navigation variants",()=>{
    expect(publicPath("https://truenorthmap.ca/organizations/example?returnTo=/map")).toBe("/organizations/example");
    for(const path of ["/api/health","/collections","/organizations/%2e%2e/account","https://example.org/organizations/test","//example.org/"]) expect(publicPath(path)).toBeNull();
    expect(validAiReport({...report,rawQueries:["private"]})).toBe(false);
    const bundle={schemaVersion:"tnm_visibility_intelligence_v1",aiReports:[report],searchCohorts:[],ga4:null,answerSources:[],bingHealth:[],indexCoverage:null,annotations:[]};
    expect(validIntelligence(bundle)).toBe(true);
    expect(validIntelligence({...bundle,referrer:"private"})).toBe(false);
  });
  it("handles Bing dates and missing diagnostic metrics without inventing zeros",()=>{
    expect(parseBingDate("/Date(1788480000000-0700)/")).toBe("2026-09-04");
    expect(parseBingDate("unknown")).toBeNull();
    expect(bingHealthRows([{Date:"2026-09-04",InIndex:1070,Code5xx:0}])[0]).toMatchObject({indexed:1070,http5xx:0,crawled:null});
  });
  it("does not turn distant rankings into snippet CTR opportunities",()=>{
    expect(rankOpportunity({impressions:839,ctr:0,position:68})).toBe("monitor");
    expect(rankOpportunity({impressions:2092,ctr:4/2092,position:8.5})).toBe("ctr");
    expect(rankOpportunity({impressions:2,ctr:0,position:8})).toBe("emerging");
  });
  it("accepts only the aggregate product contract",()=>{
    const summary={schemaVersion:"tnm_product_activity_summary_v1",collectedAt:report.collectedAt,period:{...report.period,timeZone:"America/Halifax"},firstObservedDate:"2026-08-27",rows:[{date:"2026-09-01",event:"dossier_open",routeFamily:"organizations",channel:"internal",events:3,observedSessions:2,taggedEvents:0}]};
    expect(validProductSummary(summary)).toBe(true);
    expect(validProductSummary({...summary,sessionId:"secret"})).toBe(false);
    expect(validProductSummary({...summary,rows:[{...summary.rows[0],events:1}]})).toBe(false);
  });
});
