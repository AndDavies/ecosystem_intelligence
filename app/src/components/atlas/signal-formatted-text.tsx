import React, { Fragment } from "react";
import { signalInlineTokens } from "@/lib/signals/formatting";

function Inline({ text }: { text: string }) {
  return signalInlineTokens(text).map((token, index) => token.kind === "link"
    ? <a key={index} href={token.href} className="atlas-prose-link [overflow-wrap:anywhere]">{token.text}</a>
    : token.kind === "bold" ? <strong key={index}>{token.text}</strong>
    : token.kind === "italic" ? <em key={index}>{token.text}</em>
    : <Fragment key={index}>{token.text}</Fragment>);
}

export function SignalFormattedText({ text, className = "" }: { text: string; className?: string }) {
  const blocks: { kind: "p" | "ul" | "ol"; lines: string[] }[] = [];
  let active: typeof blocks[number] | undefined;
  for (const line of text.split("\n")) {
    if (!line.trim()) { active = undefined; continue; }
    const list = line.match(/^\s*(- |\d+\. )(.*)$/);
    const kind = list ? (list[1] === "- " ? "ul" : "ol") : "p";
    if (!active || active.kind !== kind) { active = { kind, lines: [] }; blocks.push(active); }
    active.lines.push(list ? list[2] : line);
  }
  return <div className={`${className} space-y-4`}>{blocks.map((block, index) => {
    if (block.kind === "p") return <p key={index}>{block.lines.map((line, i) => <Fragment key={i}>{i ? <br /> : null}<Inline text={line} /></Fragment>)}</p>;
    const List = block.kind;
    return <List key={index} className={`${block.kind === "ul" ? "list-disc" : "list-decimal"} pl-6 space-y-1`}>{block.lines.map((line, i) => <li key={i}><Inline text={line} /></li>)}</List>;
  })}</div>;
}
