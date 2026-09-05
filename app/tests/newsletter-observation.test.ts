import {beforeEach, describe, expect, it, vi} from "vitest";
vi.mock("server-only",()=>({}));
const observe = vi.hoisted(()=>vi.fn());
vi.mock("@/lib/email/observe-newsletter",()=>({observeNewsletter:observe}));
import {GET} from "@/app/api/cron/newsletter-observation/route";
import {campaignPurpose,campaignStream,emptyNewsletterMetrics,newsletterObservationSchema} from "@/lib/email/newsletter-observation";
import {buildDefenceSignalAlertHtml,signalFeedBaseline} from "@/lib/email/defence-signal-alerts";
import {parseMailerLiteCampaignAggregate} from "@/lib/email/mailerlite-campaign-metrics";
const summary = ()=>({schemaVersion:"tnm_newsletter_observation_v1",collectedAt:"2026-09-05T12:00:00.000Z",status:"available",errors:[],groups:{master:4,weekly:4,signalAlerts:0},preferences:{checked:8,verified:8,mismatches:0,changedDuringCheck:0,unrecordedMemberships:0},welcome:{enabled:true,metrics:emptyNewsletterMetrics()},alerts:{status:"draft"},campaigns:[]});
describe("Newsletter observation boundary",()=>{
 beforeEach(()=>{vi.unstubAllEnvs();observe.mockReset();});
 it("requires a configured exact bearer secret before any collection",async()=>{
  for(const secret of ["", "server-secret"]){vi.stubEnv("CRON_SECRET",secret);expect((await GET(new Request("https://truenorthmap.ca/api/cron/newsletter-observation"))).status).toBe(401);}
  expect((await GET(new Request("https://truenorthmap.ca/api/cron/newsletter-observation",{headers:{authorization:"Bearer wrong-secret"}}))).status).toBe(401);
  expect(observe).not.toHaveBeenCalled();
 });
 it("reports incomplete collection as a failed cron invocation",async()=>{
  vi.stubEnv("CRON_SECRET","server-secret"); observe.mockResolvedValue({...summary(),status:"partial",errors:["campaigns"]});
  const response=await GET(new Request("https://truenorthmap.ca/api/cron/newsletter-observation",{headers:{authorization:"Bearer server-secret"}}));
  expect(response.status).toBe(503);expect(response.headers.get("cache-control")).toContain("no-store");
 });
 it("accepts aggregate unknowns and rejects subscriber data at any level",()=>{
  expect(newsletterObservationSchema.safeParse(summary()).success).toBe(true);
  expect(newsletterObservationSchema.safeParse({...summary(),email:"reader@example.com"}).success).toBe(false);
  expect(newsletterObservationSchema.safeParse({...summary(),groups:{...summary().groups,emails:[]}}).success).toBe(false);
  expect(newsletterObservationSchema.safeParse({...summary(),welcome:{...summary().welcome,metrics:{...emptyNewsletterMetrics(),sent:-1}}}).success).toBe(false);
 });
 it("excludes mixed, legacy and unconstrained campaigns from delivery reporting",()=>{
  const groups={weekly:"1",signalAlerts:"2"};const rule=(ids:string[])=>({operator:"in_any",args:["groups",ids]});
  expect(campaignStream([[rule(["1"])]],groups)).toBe("weekly");
  expect(campaignStream([[rule(["2"])]],groups)).toBe("signal_alerts");
  for(const filter of [null,[],[[rule(["1","9"])]],[[rule(["1"])],[]],[[rule(["1"])],[rule(["2"])]],[[rule(["9"])]]])expect(campaignStream(filter,groups)).toBeNull();
  expect(campaignPurpose("196945915690353799","Weekly")).toBe("verification");
  expect(campaignPurpose("44","North Signal QA check")).toBe("verification");
  expect(campaignPurpose("45","North Signal: procurement changes")).toBe("production");
 });
 it("never converts absent campaign counts to zeros",()=>{
  expect(parseMailerLiteCampaignAggregate({data:{id:"1",status:"sent",stats:{sent:5}}})).toBeNull();
 });
 it("keeps full summaries and escaped limits in readable alert HTML",()=>{
  const html=buildDefenceSignalAlertHtml({executiveSummary:"First paragraph.\n\nSecond <script> paragraph.",topics:["A & B"],principalLimit:"Timing <unknown>",url:"https://truenorthmap.ca/signals/example",slug:"example"});
  expect(html).toContain("Second &lt;script&gt; paragraph.");expect(html).toContain("Timing &lt;unknown&gt;");expect(html).toContain("#F5E900");expect(html).toContain("utm_campaign=defence_signal_alerts");expect(html).not.toContain("<script>");
 });
 it("requires an explicit valid past activation baseline",()=>{
  expect(signalFeedBaseline(null)).toBeNull();expect(signalFeedBaseline("2026-09-05T12:00:00Z",Date.parse("2026-09-05T13:00:00Z"))).toBe(Date.parse("2026-09-05T12:00:00Z"));
  for(const value of ["", "2026-02-31T00:00:00Z", "2026-09-05", "2030-01-01T00:00:00Z"])expect(()=>signalFeedBaseline(value,Date.parse("2026-09-05T13:00:00Z"))).toThrow();
 });
});
