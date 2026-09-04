import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/indexnow-key/route";
import { middleware } from "@/middleware";
import {
  indexNowInternalKeyHeader,
  indexNowEndpoint,
  indexNowKeyLocation,
  indexNowPublicUrl,
  isValidIndexNowKey,
  singleUrlIndexNowPayload
} from "@/lib/seo/indexnow";
import { submitSingleUrlIndexNow } from "@/lib/seo/indexnow-submission";

const originalKey = process.env.INDEXNOW_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.INDEXNOW_KEY;
  else process.env.INDEXNOW_KEY = originalKey;
});

describe("IndexNow", () => {
  it("validates the protocol key without exposing it through a fixed public API route", async () => {
    const key = "A1b2C3d4-indexnow-test";
    process.env.INDEXNOW_KEY = key;
    expect(isValidIndexNowKey(key)).toBe(true);
    expect(isValidIndexNowKey("short")).toBe(false);
    expect(indexNowKeyLocation(key)).toBe(`https://truenorthmap.ca/${key}.txt`);

    const direct = GET(new Request("https://truenorthmap.ca/api/indexnow-key"));
    expect(direct.status).toBe(404);

    const rewritten = GET(new Request("https://truenorthmap.ca/api/indexnow-key", {
      headers: { [indexNowInternalKeyHeader]: key }
    }));
    expect(rewritten.status).toBe(200);
    expect(await rewritten.text()).toBe(key);
    expect(rewritten.headers.get("cache-control")).toBe("no-store");
    expect(rewritten.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(rewritten.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("builds a single canonical public URL notification", () => {
    const key = "A1b2C3d4-indexnow-test";
    const payload = singleUrlIndexNowPayload(key, "/organizations/mda-space");
    expect(payload.urlList).toEqual(["https://truenorthmap.ca/organizations/mda-space"]);
    expect(payload.host).toBe("truenorthmap.ca");
    expect(payload.keyLocation).toBe(`https://truenorthmap.ca/${key}.txt`);
  });

  it("rejects non-canonical and private paths", () => {
    expect(() => indexNowPublicUrl("https://example.com/page")).toThrow(/site-relative/);
    expect(() => indexNowPublicUrl("//example.com/page")).toThrow(/site-relative/);
    expect(() => indexNowPublicUrl("/organizations/mda-space?preview=1")).toThrow(/canonical/);
    expect(() => indexNowPublicUrl("/admin/publish")).toThrow(/private/);
    expect(() => indexNowPublicUrl("/api/health")).toThrow(/private/);
    expect(() => indexNowPublicUrl("/%61dmin")).toThrow(/unencoded/);
    expect(() => indexNowPublicUrl("/%61pi/health")).toThrow(/unencoded/);
    expect(() => indexNowPublicUrl("/%63ollections")).toThrow(/unencoded/);
    expect(() => indexNowPublicUrl("/admin%2Fpublish")).toThrow(/unencoded/);
    expect(() => indexNowPublicUrl("/organizations/mda-space/")).toThrow(/trailing-slash/);
  });

  it("rewrites only the exact configured verification filename", async () => {
    const key = "A1b2C3d4-indexnow-test";
    process.env.INDEXNOW_KEY = key;

    const matching = await middleware(new NextRequest(`https://truenorthmap.ca/${key}.txt`));
    expect(matching.headers.get("x-middleware-rewrite")).toBe("https://truenorthmap.ca/api/indexnow-key");

    const unrelated = await middleware(new NextRequest("https://truenorthmap.ca/robots.txt"));
    expect(unrelated.headers.get("x-middleware-next")).toBe("1");
    expect(unrelated.headers.get("x-middleware-rewrite")).toBeNull();

    delete process.env.INDEXNOW_KEY;
    const missing = await middleware(new NextRequest(`https://truenorthmap.ca/${key}.txt`));
    expect(missing.headers.get("x-middleware-next")).toBe("1");

    process.env.INDEXNOW_KEY = "invalid";
    const invalid = await middleware(new NextRequest(`https://truenorthmap.ca/${key}.txt`));
    expect(invalid.headers.get("x-middleware-next")).toBe("1");
  });

  it("verifies ownership before sending one exact URL notification", async () => {
    const key = "A1b2C3d4-indexnow-test";
    const payload = singleUrlIndexNowPayload(key, "/organizations/mda-space");
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ input: input.toString(), init });
      return calls.length === 1
        ? new Response(key, { status: 200 })
        : new Response(null, { status: 200 });
    }) as typeof fetch;

    await expect(submitSingleUrlIndexNow(payload, fetcher)).resolves.toEqual({
      mode: "submitted",
      status: 200
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]?.input).toBe(payload.keyLocation);
    expect(calls[1]?.input).toBe(indexNowEndpoint);
    expect(calls[1]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[1]?.init?.body))).toEqual(payload);
  });

  it("stops before submission when the public key file is not exact", async () => {
    const payload = singleUrlIndexNowPayload("A1b2C3d4-indexnow-test", "/organizations/mda-space");
    let calls = 0;
    const fetcher = (async () => {
      calls += 1;
      return new Response(`${payload.key}\n`, { status: 200 });
    }) as typeof fetch;

    await expect(submitSingleUrlIndexNow(payload, fetcher)).rejects.toThrow(/ownership verification failed/);
    expect(calls).toBe(1);
  });

  it("reports a 202 response as pending key validation", async () => {
    const key = "A1b2C3d4-indexnow-test";
    const payload = singleUrlIndexNowPayload(key, "/organizations/mda-space");
    let calls = 0;
    const fetcher = (async () => {
      calls += 1;
      return calls === 1 ? new Response(key, { status: 200 }) : new Response(null, { status: 202 });
    }) as typeof fetch;

    await expect(submitSingleUrlIndexNow(payload, fetcher)).resolves.toEqual({
      mode: "accepted_pending_key_validation",
      status: 202
    });
  });

  it("keeps the operator command explicit and independent of the sitemap", async () => {
    const [script, middleware] = await Promise.all([
      readFile(path.resolve("scripts/submit-indexnow.ts"), "utf8"),
      readFile(path.resolve("src/middleware.ts"), "utf8")
    ]);
    expect(script).toContain('process.argv.includes("--apply")');
    expect(script).toContain('argument("--path")');
    expect(script).toContain("submitSingleUrlIndexNow(payload)");
    expect(script).not.toContain("sitemap");
    expect(script).not.toContain("urlList: [");
    expect(middleware).toContain('"/:indexnowKey.txt"');
  });
});
