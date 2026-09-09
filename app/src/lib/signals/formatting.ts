export function signalLinkHref(value: string): string | null {
  if (/[\s\\]/.test(value) || [...value].some(char => char.charCodeAt(0) < 32)) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

// Deliberately small editorial vocabulary: links, bold and italic; no raw HTML.
export function signalInlineTokens(text: string) {
  const pattern = /\[([^\]\n]+)\]\(((?:[^\s()]|\([^\s()]*\))+)\)(\{target=_(?:blank|self)\})?|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  const tokens: { text: string; kind: "text" | "link" | "bold" | "italic"; href?: string; newTab?: boolean }[] = [];
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > end) tokens.push({ kind: "text", text: text.slice(end, match.index) });
    const href = match[2] ? signalLinkHref(match[2]) : null;
    tokens.push(match[1] ? { kind: href ? "link" : "text", text: match[1], ...(href ? { href, newTab: match[3] === "{target=_blank}" || (!match[3] && /^https?:/i.test(href)) } : {}) } : { kind: match[4] ? "bold" : "italic", text: match[4] ?? match[5] });
    end = match.index + match[0].length;
  }
  if (end < text.length) tokens.push({ kind: "text", text: text.slice(end) });
  return tokens;
}

export function signalPlainText(text: string) {
  return text.split("\n").map(line => signalInlineTokens(line.replace(/^\s*(?:- |\d+\. )/, "")).map(token => token.text).join("")).join("\n");
}
