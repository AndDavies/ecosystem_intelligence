import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SignalFormattedText } from "../src/components/atlas/signal-formatted-text";
import { signalPlainText } from "../src/lib/signals/formatting";

describe("Signals editorial formatting", () => {
  it("renders formatting, lists and existing-style links without raw HTML", () => {
    const html = renderToStaticMarkup(React.createElement(SignalFormattedText, { text: '**Strong** and *emphasis*\n\n- [Read](https://example.com/report_(final))\n- Next\n\n<script>alert(1)</script>' }));
    expect(html).toContain('<strong>Strong</strong>');
    expect(html).toContain('<em>emphasis</em>');
    expect(html).toContain('<ul');
    expect(html).toContain('href="https://example.com/report_(final)"');
    expect(html).toContain('atlas-prose-link');
    expect(html).not.toContain('<script>');
  });
  it("rejects executable and protocol-relative links while keeping their text", () => {
    const html = renderToStaticMarkup(React.createElement(SignalFormattedText, { text: '[Bad](javascript:alert(1)) [Bad](//evil.example) [Good](/missions)' }));
    expect(html.match(/href=/g)).toHaveLength(1);
    expect(html).toContain('href="/missions"');
    expect(html).toContain('Bad');
  });
  it("preserves per-link tab choices and strips target markers from excerpts", () => {
    const text = '[External](https://example.com){target=_blank} [Internal](/missions)';
    const html = renderToStaticMarkup(React.createElement(SignalFormattedText, { text }));
    expect(html).toContain('target="_blank" rel="noopener noreferrer"');
    expect(html.match(/target=/g)).toHaveLength(1);
    expect(html).not.toContain('{target=');
    expect(signalPlainText(text)).toBe('External Internal');
  });
  it("keeps snippets readable without markup or destination URLs", () => {
    expect(signalPlainText('**Ready** [report](https://example.com)\n- Item')).toBe('Ready report\nItem');
  });
});
