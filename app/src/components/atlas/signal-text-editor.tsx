"use client";

import { useId, useRef, useState } from "react";
import { SignalFormattedText } from "./signal-formatted-text";
import { signalLinkHref } from "@/lib/signals/formatting";

export function SignalTextEditor({ name, label, defaultValue, rows = 5, required = false }: { name: string; label: string; defaultValue: string; rows?: number; required?: boolean }) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [newTab, setNewTab] = useState(true);
  const [url, setUrl] = useState("");
  const [labelText, setLabelText] = useState("");
  const [error, setError] = useState("");
  function insert(kind: "bold" | "italic" | "bullet" | "number" | "link") {
    const { start, end } = kind === "link" ? selection.current : { start: field.current?.selectionStart ?? 0, end: field.current?.selectionEnd ?? 0 };
    const selected = value.slice(start, end);
    const replacement = kind === "link" ? `[${labelText}](${url})${newTab ? "{target=_blank}" : ""}` : kind === "bold" ? `**${selected || "bold text"}**` : kind === "italic" ? `*${selected || "italic text"}*` : `${start && value[start - 1] !== "\n" ? "\n" : ""}${(selected || "List item").split("\n").map((line, i) => `${kind === "bullet" ? "-" : `${i + 1}.`} ${line}`).join("\n")}${end < value.length && value[end] !== "\n" ? "\n" : ""}`;
    setValue(value.slice(0, start) + replacement + value.slice(end));
    setPreview(false);
    requestAnimationFrame(() => { field.current?.focus(); field.current?.setSelectionRange(start, start + replacement.length); });
  }
  const buttonClass = "min-h-10 rounded px-3 text-sm font-semibold hover:bg-[var(--atlas-surface-muted)]";
  return <div>
    <label htmlFor={id} className="text-xs font-bold">{label}</label>
    <div className="mt-1 rounded-xl border border-[var(--atlas-border)] bg-white p-2">
      <div role="group" aria-label={`${label} formatting`} className="flex flex-wrap gap-1">
        <button type="button" className={buttonClass} onClick={() => insert("bold")}>Bold</button>
        <button type="button" className={buttonClass} onClick={() => insert("italic")}>Italic</button>
        <button type="button" className={buttonClass} onClick={() => { selection.current = { start: field.current?.selectionStart ?? 0, end: field.current?.selectionEnd ?? 0 }; setLabelText(value.slice(selection.current.start, selection.current.end)); setUrl(""); setNewTab(true); setError(""); setLinkOpen(true); }}>Link</button>
        <button type="button" className={buttonClass} onClick={() => insert("bullet")}>Bullets</button>
        <button type="button" className={buttonClass} onClick={() => insert("number")}>Numbered list</button>
        <button type="button" className={buttonClass} aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? "Edit" : "Preview"}</button>
      </div>
      {linkOpen ? <div className="my-2 grid gap-2 rounded-lg bg-[var(--atlas-surface-muted)] p-3">
        <label className="text-sm">Link text<input value={labelText} onChange={e => setLabelText(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        <label className="text-sm">URL<input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://… or /organizations/…" className="mt-1 w-full rounded border p-2" /></label>
        <label className="text-sm">Open link in<select value={newTab ? "new" : "same"} onChange={e => setNewTab(e.target.value === "new")} className="mt-1 w-full rounded border p-2"><option value="new">New tab</option><option value="same">Same tab</option></select></label>
        {error ? <p role="alert" className="text-sm">{error}</p> : null}
        <div><button type="button" className={buttonClass} onClick={() => { if (!signalLinkHref(url) || !labelText.trim() || ["[", "]", "\n"].some(char => labelText.includes(char))) { setError("Enter link text and a valid http(s) URL or site path."); return; } insert("link"); setLinkOpen(false); }}>Insert link</button><button type="button" className={buttonClass} onClick={() => setLinkOpen(false)}>Cancel</button></div>
      </div> : null}
      <textarea ref={field} id={id} name={name} value={value} onChange={e => setValue(e.target.value)} required={required} rows={rows} aria-describedby={`${id}-help`} className="w-full rounded-lg px-2 py-2 text-sm leading-6" />
      {preview ? <div className="border-t p-3"><p className="mb-2 text-xs font-bold">Preview</p><SignalFormattedText text={value} className="text-sm leading-6" /></div> : null}
    </div>
    <p id={`${id}-help`} className="mt-1 text-xs text-[var(--atlas-muted)]">Select text and choose formatting, or use **bold**, *italic*, [link text](https://example.com), and list lines. Preview does not save changes.</p>
  </div>;
}
