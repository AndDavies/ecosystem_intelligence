"use client";

import Link from "next/link";
import { useState } from "react";
import { assistantTestCases, assistantTestModes } from "@/lib/atlas/assistant-test-cases";
import type { AtlasAssistantAnswer } from "@/types/atlas";

type Result = { error?: string; audit?: unknown; quality?: string; notes?: string; query: string; diagnostics: Record<string, unknown>; answer: AtlasAssistantAnswer | null;
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
    const started = performance.now();
    try {
      const response = await fetch("/api/admin/ask-tests", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseIndex, mode, ...(mode === "answer-replay" ? { receipt: receipts[caseIndex] } : {}) }) });
      const data = await response.json();
      const result = { query: assistantTestCases[caseIndex], answer: null, sources: [], organizations: [], ...data,
        diagnostics: { mode, caseIndex, ...data.diagnostics, httpStatus: response.status, browserMs: Math.round(performance.now()-started) } };
      setResults(previous => [result, ...previous]);
      if (!response.ok) setError(data.error ?? "Test failed; attempt saved.");
      if (data.receipt) setReceipts(previous => ({ ...previous, [caseIndex]: data.receipt }));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Test failed.";
      setError(message);
      setResults(previous => [{ query: assistantTestCases[caseIndex], error: message, answer: null, sources: [], organizations: [], receipt: null,
        diagnostics: { mode, caseIndex, startedAt: new Date().toISOString(), phase: "browser", httpStatus: null, browserMs: Math.round(performance.now()-started) } }, ...previous]);
    }
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
      <p className="text-sm text-muted-foreground">For this round, run both lexical and fresh Jev for each question: lexical first on questions 1, 3 and 5; Jev first on 2 and 4. Ten runs total. Judge usefulness, missing organizations and source support before comparing speed. No environment changes are needed. Cache and hybrid trials can wait until these results are reviewed. Answer replay holds the previous result’s exact catalogue and evidence fixed; it rejects changed evidence. Hybrid pools are experiments, not full catalogue coverage.</p>
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
            ["Cache",String(s.cacheStatus ?? "bypass")],["Coverage",typeof d.catalogueCount === "number" ? `${s.scoredOrganizations ?? 0} / ${d.catalogueCount}` : "—"]].map(([label,value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words font-semibold">{value}</dd></div>)}
        </dl>
        <p>Selection fallback: {String(s.fallbackReason ?? (result.error ? "unavailable" : "none"))}. Answer fallback: {String(d.fallbackReason ?? (result.error ? "unavailable" : "none"))}. Jev usage {s.usageComplete === false ? "incomplete; cost may be higher" : s.usageComplete === true ? "reported" : "unavailable"}.</p>
        <p className="text-sm text-muted-foreground">Run {String(d.runId ?? "unavailable")} · {String(d.startedAt ?? "")} · {String(d.deploymentSha ?? "").slice(0,7)} · Browser {seconds(d.browserMs)}</p>
        {result.error && <p role="alert">{result.error}</p>}
        <p>{result.answer?.summary ?? "No answer returned."}</p>
        {!!result.answer?.gaps.length && <div><p className="font-semibold">What remains unverified</p><ul className="list-disc pl-5">{result.answer.gaps.map(gap => <li key={gap}>{gap}</li>)}</ul></div>}
        {!!result.answer?.followUpSuggestions.length && <p>Useful follow-up: {result.answer.followUpSuggestions.join(" · ")}</p>}
        <label className="block">Result usefulness <select className="ml-3 rounded-xl border px-3 py-2" value={result.quality ?? "unreviewed"} onChange={event => setResults(previous => previous.map((r,i) => i === index ? { ...r, quality: event.target.value } : r))}><option value="unreviewed">Not reviewed</option><option value="useful">Useful and supported</option><option value="partial">Partly useful</option><option value="not-useful">Not useful</option></select></label>
        <label className="block">Missing organizations or questionable claims<textarea className="mt-2 block w-full rounded-xl border p-3" maxLength={2000} value={result.notes ?? ""} onChange={event => setResults(previous => previous.map((r,i) => i === index ? { ...r, notes: event.target.value } : r))} /></label>
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
