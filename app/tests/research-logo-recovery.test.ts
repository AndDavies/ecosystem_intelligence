import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { officialLogoSourcePages } from "../src/lib/research/logo-recovery";
import { researchCandidateBatchV2Schema } from "../src/lib/research/pipeline-schema";
import { buildMinimalOrganizationV3Candidate } from "./fixtures/organization-dossier-candidates";

const execute = promisify(execFile);

describe("private official-logo recovery", () => {
  it("uses observed official HTML routes, prioritizes brand pages and excludes unrelated evidence", () => {
    expect(officialLogoSourcePages("https://example.ca/", [
      "https://press.example.net/logo", "https://example.ca/spec.pdf",
      "https://example.ca/about#team", "http://example.ca/brand",
      "https://user:password@example.ca/brand", "https://example.ca/about",
      "https://example.ca/product", "https://example.ca/logo.svg", "invalid"
    ])).toEqual(["https://example.ca/", "https://example.ca/about", "https://example.ca/product"]);
  });

  it("recovers a missing logo from another official page without replacing successful dispositions or losing packet entries", async () => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), "tnm-logo-test-"));
    const appDirectory = path.join(temporary, "app");
    const candidatePath = path.join(temporary, "candidate.json");
    const downloader = path.join(temporary, "downloader.py");
    const calls = path.join(temporary, "calls.txt");
    await mkdir(appDirectory);
    const missing = buildMinimalOrganizationV3Candidate();
    Object.assign(missing, { candidateLogo: { status: "not_found", checkedAt: new Date().toISOString(), note: "Earlier homepage extraction did not find a mark." } });
    const sourcePages = path.join(temporary, "source-pages.json");
    await writeFile(sourcePages, JSON.stringify({ [missing.candidateId]: ["https://fixtures.truenorthmap.ca/brand"] }));
    const ready = structuredClone(missing);
    ready.candidateId = "existing-ready";
    Object.assign(ready, { candidateLogo: {
      status: "ready", confidence: "high", sourcePageUrl: "https://fixtures.truenorthmap.ca/",
      sourceAssetUrl: "https://fixtures.truenorthmap.ca/logo.svg", selectionMethod: "page_logo_image",
      sourceChecksum: "a".repeat(64), normalizedChecksum: "b".repeat(64),
      packetPath: "research/ingestion/local/existing.source.json", note: "Previously recovered official identity mark."
    } });
    const batch = researchCandidateBatchV2Schema.parse({
      schemaVersion: "research_candidate_batch_v2", batchId: "logo-test", runId: "logo-test-run",
      title: "Private logo recovery fixture", status: "candidate", createdAt: new Date().toISOString(),
      selectedGap: { coverageView: "supply", dimension: "testing", reason: "Offline fixture for private logo recovery only.", score: 1 },
      sourceLeadBatchPath: "private-fixture.json", guardrailNotes: ["Offline fixture with no production access or publication."],
      candidates: [missing, ready], deferred: []
    });
    const packetPath = path.join(temporary, "research/ingestion/local/candidate-logo-packets-v1/logo-test.json");
    await mkdir(path.dirname(packetPath), { recursive: true });
    const previous = { candidateId: ready.candidateId, organizationName: ready.organization.name, logo: batch.candidates[1].candidateKind === "organization_bundle" ? batch.candidates[1].candidateLogo : null };
    await writeFile(packetPath, JSON.stringify({ runId: batch.runId, batchId: batch.batchId, results: [previous] }));
    await writeFile(candidatePath, JSON.stringify(batch));
    await writeFile(downloader, `import sys,json,pathlib,hashlib,os
page=sys.argv[1]
with open(os.environ['LOGO_TEST_CALLS'],'a') as f: f.write(page+'\\n')
if os.environ.get('LOGO_TEST_RATE_LIMIT') or not page.endswith('/brand'):
    print(json.dumps({'error':'429 Too Many Requests' if os.environ.get('LOGO_TEST_RATE_LIMIT') else 'No acceptable official-logo candidate found.'}))
    sys.exit(2)
directory=pathlib.Path(sys.argv[sys.argv.index('--output-dir')+1])
asset=directory/'logo.svg'
asset.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60"><rect width="180" height="60" fill="red"/></svg>')
manifest=directory/'logo.source.json'
result={'ok':True,'logo_path':str(asset),'manifest_path':str(manifest),'source_page_url':page,'asset_url':'https://fixtures.truenorthmap.ca/dossier-logo.svg','selection_method':'page_logo_image','confidence':'high','sha256':hashlib.sha256(asset.read_bytes()).hexdigest()}
manifest.write_text(json.dumps(result))
print(json.dumps(result))
`);
    const run = (flags: string[] = [], additionalEnv: Record<string, string> = {}) => execute(process.execPath, [
      path.resolve("node_modules/tsx/dist/cli.mjs"), "--tsconfig", path.resolve("tsconfig.json"), path.resolve("scripts/prepare-candidate-logos.ts"),
      "--run", batch.runId, "--candidates", candidatePath, "--source-pages", sourcePages, "--apply", ...flags
    ], { cwd: appDirectory, env: { ...process.env, COMPANY_LOGO_DOWNLOADER_SCRIPT: downloader, LOGO_TEST_CALLS: calls, ...additionalEnv } });
    try {
      await run();
      expect(await readFile(candidatePath, "utf8")).toBe(JSON.stringify(batch));
      await run(["--retry-missing"]);
      const recovered = researchCandidateBatchV2Schema.parse(JSON.parse(await readFile(candidatePath, "utf8")));
      expect(recovered.candidates[1]).toEqual(batch.candidates[1]);
      const logo = recovered.candidates[0].candidateKind === "organization_bundle" ? recovered.candidates[0].candidateLogo : undefined;
      expect(logo?.status).toBe("ready");
      if (logo?.status === "ready") {
        expect(logo.sourcePageUrl).toBe("https://fixtures.truenorthmap.ca/brand");
        expect(logo.normalizedChecksum).toMatch(/^[a-f0-9]{64}$/);
      }
      const packet = JSON.parse(await readFile(packetPath, "utf8"));
      expect(packet.results).toHaveLength(2);
      expect(packet.results.find((entry: { candidateId: string }) => entry.candidateId === ready.candidateId)).toEqual(previous);
      const firstCalls = await readFile(calls, "utf8");
      expect(firstCalls.trim().split("\n")).toHaveLength(2);
      await run(["--retry-missing"]);
      expect(await readFile(calls, "utf8")).toBe(firstCalls);

      await writeFile(candidatePath, JSON.stringify(batch));
      await writeFile(calls, "");
      await run(["--retry-missing"], { LOGO_TEST_RATE_LIMIT: "1" });
      expect((await readFile(calls, "utf8")).trim().split("\n")).toHaveLength(1);
      const limited = JSON.parse(await readFile(candidatePath, "utf8"));
      expect(limited.candidates[0].candidateLogo.status).toBe("not_found");
      expect(limited.candidates[1]).toEqual(batch.candidates[1]);

      await mkdir(`${candidatePath}.logos.lock`);
      const beforeLocked = await readFile(candidatePath, "utf8");
      await expect(run(["--retry-missing"])).rejects.toThrow(/locked/);
      expect(await readFile(candidatePath, "utf8")).toBe(beforeLocked);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }, 30_000);
});
