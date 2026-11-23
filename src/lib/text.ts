/** Normalise free-text answers so "Hadn't  I known." matches "hadn't i known". */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.,!?;:"]+$/g, "")
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Expand common contractions so "would not" and "wouldn't" are treated alike. */
export function expandContractions(s: string): string {
  return s
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bcan't\b/g, "cannot")
    .replace(/\bshan't\b/g, "shall not")
    .replace(/n't\b/g, " not")
    .replace(/'re\b/g, " are")
    .replace(/'ve\b/g, " have")
    .replace(/'ll\b/g, " will")
    .replace(/'d\b/g, " would")
    .replace(/'m\b/g, " am")
    .replace(/\bcan not\b/g, "cannot")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(s: string): number {
  const m = s.trim().match(/[A-Za-zÀ-ÿ0-9’'-]+/g);
  return m ? m.length : 0;
}

export function sentences(s: string): string[] {
  return s
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"“])/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Tiny markdown-lite: **bold** → <strong>. Returns React-safe segments. */
export function boldSegments(s: string): { text: string; bold: boolean }[] {
  const parts = s.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p) => (p.startsWith("**") ? { text: p.slice(2, -2), bold: true } : { text: p, bold: false }));
}
