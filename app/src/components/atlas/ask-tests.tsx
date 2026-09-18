"use client";

import Link from "next/link";
import { useState } from "react";
import { assistantTestCases, assistantTestModes } from "@/lib/atlas/assistant-test-cases";
import type { AtlasAssistantAnswer } from "@/types/atlas";

type Result = { query: string; diagnostics: Record<string, unknown>; answer: AtlasAssistantAnswer | null;
  sources: { title: string; url: string }[];
  organizations: { id: string; name: string; slug: string }[]; receipt: string | null };
const labels: Record<typeof assistantTestModes[number], string> = {
  lexical: "Lexical baseline", "full-fresh": "Full catalogue · fresh Jev", "full-cached": "Full catalogue · allow cache",
  "hybrid-50": "Hybrid pool · 50", "hybrid-100": "Hybrid pool · 100", "answer-replay": "Same evidence · answer replay"
};
const seconds = (value: unknown) => typeof value === "number" ? `${(value/1000).toFixed(2)} s` : "—";

export function AskTests() {
  const [mode, setMode] = useState<typeof assistantTestModes[number]>("lexical");
  const [results, setResults] = useState<Result[]>([]);
  const [receipts, setReceipts] = useState<Record<number,string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  async function run(caseIndex: number) {
    if (busy !== null) return;
    setBusy(caseIndex); setError("");
    try {
      const response = await fetch("/api/admin/ask-tests", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseIndex, mode, ...(mode === "answer-replay" ? { receipt: receipts[caseIndex] } : {}) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Test failed.");
      setResults(previous => [data, ...previous]);
      if (data.receipt) setReceipts(previous => ({ ...previous, [caseIndex]: data.receipt }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Test failed."); }
    finally { setBusy(null); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(results.map(({ receipt: _receipt, ...result }) => result), null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `ask-tests-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url);
  }
  return <div className="mx-auto max-w-5xl space-y-8">
    <header className="space-y-3"><Link className="atlas-prose-link" href="/admin">Back to Admin</Link>
      <h1 className="text-3xl font-bold">Ask True North tests</h1>
      <p>Owner-only, manual tests using the five saved questions. Each Run makes paid requests; nothing runs automatically. These tests do not consume the normal visitor allowance.</p>
      <p className="text-sm text-muted-foreground">Start with lexical, then fresh Jev for the same questions. Repeat with the cache allowed to measure reuse. Answer replay holds the previous result’s exact catalogue and evidence fixed; it rejects changed evidence. Hybrid pools are experiments, not full catalogue coverage.</p>
    </header>
    <label className="block font-semibold" htmlFor="ask-test-mode">Comparison mode
      <select id="ask-test-mode" className="mt-2 block min-h-11 w-full rounded-xl border bg-white px-3 text-foreground" disabled={busy !== null} value={mode} onChange={event => setMode(event.target.value as typeof mode)}>
        {assistantTestModes.map(value => <option key={value} value={value}>{labels[value]}</option>)}
      </select>
    </label>
    <ol className="divide-y">{assistantTestCases.map((query, index) => <li key={query} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-3xl">{index+1}. {query}</p>
      <button type="button" className="min-h-11 rounded-full border px-5 font-semibold disabled:opacity-50" disabled={busy !== null || (mode === "answer-replay" && !receipts[index])} onClick={() => void run(index)}>{busy === index ? "Running…" : `Run ${index+1}`}</button>
    </li>)}</ol>
    <p role="status" aria-live="polite">{error || (busy !== null ? "Test in progress. Wait for the result before starting another." : "Ready. Results remain in this tab until you export or leave.")}</p>
    {!!results.length && <button type="button" className="min-h-11 rounded-full border px-5" onClick={download}>Download results JSON</button>}
    {results.map((result,index) => {
      const d = result.diagnostics;
      const s = (d.selection ?? {}) as Record<string,unknown>;
      return <article key={index} className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-bold">Question {Number(d.caseIndex)+1} · {labels[d.mode as typeof mode]}</h2>
        <dl className="grid grid-cols-2 gap-4 rounded-xl bg-muted p-4 sm:grid-cols-4">
          {[["Total",seconds(d.requestLatencyMs)],["Catalogue",seconds(d.snapshotMs)],["Selection",seconds(s.latencyMs)],["Answer",seconds(d.answerMs)],
            ["Evidence",seconds(d.evidenceMs)],["Jev cost",typeof s.estimatedCostUsd === "number" ? `$${s.estimatedCostUsd.toFixed(5)} USD` : "—"],
            ["Cache",String(s.cacheStatus ?? "bypass")],["Coverage",`${s.scoredOrganizations ?? 0} / ${d.catalogueCount}`]].map(([label,value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words font-semibold">{value}</dd></div>)}
        </dl>
        <p>Selection fallback: {String(s.fallbackReason ?? "none")}. Answer fallback: {String(d.fallbackReason ?? "none")}. Jev usage {s.usageComplete === false ? "incomplete; cost may be higher" : "reported"}.</p>
        <p>{result.answer?.summary ?? "No answer returned."}</p>
        <ol className="space-y-4">{result.answer?.matches.map(match => {
          const org = result.organizations.find(org => org.id===match.organizationId);
          return <li key={match.organizationId}><Link className="atlas-prose-link font-semibold" href={`/organizations/${org?.slug ?? ""}`} target="_blank" rel="noopener noreferrer">{org?.name ?? match.organizationId}</Link>
            <ul className="mt-2 list-disc pl-5">{match.supportPoints.map((point,i) => <li key={i}>{point.text}</li>)}</ul>
            {!!match.limitations.length && <p className="mt-2 text-sm">Qualifications: {match.limitations.join(" ")}</p>}
          </li>;
        })}</ol>
        {!!result.sources?.length && <ul className="space-y-2">{result.sources.map(source => <li key={source.url}><a className="atlas-prose-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>}
        <details><summary className="cursor-pointer py-2 font-semibold">Full diagnostics and answer evidence</summary><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-4 text-xs">{JSON.stringify({ diagnostics: d, answer: result.answer },null,2)}</pre></details>
      </article>;
    })}
  </div>;
}
