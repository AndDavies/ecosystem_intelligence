import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import NavigationLink from "../src/components/atlas/navigation-link";
import { legacyNavigationDestination, publicNavigationHref, safeMapReturn } from "../src/lib/seo/navigation-urls";
import { paginationRedirect, paginationMetadata } from "../src/lib/seo/pagination";
import { searchUrlHealth } from "../src/lib/visibility/url-health";

const origin = "https://truenorthmap.ca";
describe("search URL consolidation", () => {
  it("redirects the reported Agile URL once, preserves map context, and then stops", () => {
    const context = "/map?region=ontario&view=map&selected=0d9ea1fa-79af-4666-b815-f5d4464f8746&bounds=-87.23,38,-64.16,61.71";
    const old = new URL(`/organizations/agile-electromagnetics?returnTo=${encodeURIComponent(context)}&utm_source=test`, origin);
    const target = legacyNavigationDestination(old)!;
    expect(target).toMatch(/^\/organizations\/agile-electromagnetics\?utm_source=test#tnm-return=/);
    expect(new URLSearchParams(target.split('#')[1]).get('tnm-return')).toBe(publicNavigationHref(context));
    expect(legacyNavigationDestination(new URL(target,origin))).toBeNull();
  });
  it("supports older nested and top-level map state without an external redirect", () => {
    const target = legacyNavigationDestination(new URL('/capabilities/radar?returnTo=/map?region%3Dontario&selected=abc&bounds=1,2,3,4', origin))!;
    expect(decodeURIComponent(target)).toContain('selected=abc');
    expect(safeMapReturn('//evil.example')).toBe('/map');
    expect(safeMapReturn('/\\evil.example')).toBe('/map');
    expect(safeMapReturn('/admin')).toBe('/map');
    expect(safeMapReturn('/map?'+ 'a'.repeat(5000))).toBe('/map');
  });
  it("emits clean server-rendered profile hrefs and preserves evidence anchors", () => {
    const html=renderToStaticMarkup(createElement(NavigationLink, {href:"/capabilities/radar?returnTo=%2Fmap#evidence"}, "Radar"));
    expect(html).toContain('href="/capabilities/radar#evidence"');
    expect(html).not.toContain('returnTo');
  });
  it("keeps map state shareable and leaves tracking/private workflow URLs intact", () => {
    expect(publicNavigationHref('/map?region=ontario&focus=naval,radar&utm_source=mail')).toBe('/map?utm_source=mail#?region=ontario&focus=naval%2Cradar');
    for(const url of ['/sign-in?next=%2Fapi%2Fexport','/collections?returnTo=%2Fmap','/api/export?type=atlas-results','/organizations/radar?cold_dossier_gate=nonce']) expect(publicNavigationHref(url)).toBe(url);
  });
  it("normalizes pagination but never redirects legitimate page two to page one", () => {
    expect(paginationRedirect(new URL('/organizations?page=1',origin))).toBe('/organizations');
    expect(paginationRedirect(new URL('/regions/ontario?page=-5',origin))).toBe('/regions/ontario');
    expect(paginationRedirect(new URL('/missions/radar?page=2',origin))).toBeNull();
    expect(paginationMetadata({},'/organizations',2).alternates?.canonical).toBe('/organizations?page=2');
  });
  it("keeps URL evidence private, distinguishes missing history and measures page-level share", () => {
    expect(searchUrlHealth([{path:'/organizations/a',clicks:1,impressions:10}])).toBeNull();
    const health=searchUrlHealth([{path:'/organizations/a',sourceUrl:origin+'/organizations/a',clicks:1,impressions:10},{path:'/organizations/a',sourceUrl:origin+'/organizations/a?returnTo=%2Fmap',clicks:2,impressions:30}])!;
    expect(health.impressionShare).toBe(.75);expect(health.navigationUrls).toBe(1);
    expect(health.affected.get('/organizations/a')).toEqual({variants:1,impressions:30,clicks:2});
    expect(JSON.stringify(health)).not.toContain('returnTo');
  });
});
