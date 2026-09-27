/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// A small, dependency-free text reader for simple "text" PDFs
//
// Enough for the fuel-price tables PPAC and BPCL publish (both are
// "Microsoft Excel for Microsoft 365" exports): Flate-compressed page
// content streams, TrueType fonts with WinAnsiEncoding, and every cell
// drawn as one `x y Tm … [(…)] TJ` text object. It reads each text object
// with its position on the page and groups them into lines, top to bottom
// and left to right.
//
// It is NOT a general PDF parser: no object streams, no encryption, no
// CID fonts, no ToUnicode maps. A PDF it cannot read gives no lines, and
// the collectors then write nothing (never a guess). Pure: no I/O.
// ═══════════════════════════════════════════════════════════
import { inflateSync } from "node:zlib";

/** One piece of text and where its baseline starts (PDF points, y grows upwards). */
export interface PdfTextRun {
  /** Index of the content stream it came from (≈ page order). */
  stream: number;
  x: number;
  y: number;
  text: string;
}

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** m × n (PDF row-vector convention: a point is transformed by m, then n). */
function mul(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[1] * n[2],
    m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2],
    m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4],
    m[4] * n[1] + m[5] * n[3] + n[5],
  ];
}

// ── Streams ────────────────────────────────────────────────────────────

/** Inflate every Flate stream in the file (others are skipped). */
export function pdfStreams(buf: Uint8Array): Buffer[] {
  const bytes = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") return [];
  const out: Buffer[] = [];
  const latin = bytes.toString("latin1");
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(latin))) {
    const start = m.index + m[0].length;
    const end = latin.indexOf("endstream", start);
    if (end < 0) break;
    // The stream's dictionary sits just before the "stream" keyword.
    const dictStart = latin.lastIndexOf("obj", m.index);
    const dict = dictStart >= 0 ? latin.slice(dictStart, m.index) : "";
    re.lastIndex = end + 9;
    // Font programs and images are never page text.
    if (/\/(Length1|Length2|Subtype\s*\/(Image|Type1C|CIDFontType0C|OpenType))/.test(dict)) continue;
    if (!/\/FlateDecode/.test(dict)) continue;
    try {
      out.push(inflateSync(bytes.subarray(start, end)));
    } catch {
      // A damaged stream is skipped; the caller decides whether what is left is enough.
    }
  }
  return out;
}

// ── Content-stream tokens ──────────────────────────────────────────────

type Token = { k: "num"; v: number } | { k: "str"; v: string } | { k: "op"; v: string } | { k: "open" } | { k: "close" } | { k: "name"; v: string };

/** Decode a literal string body (the part between the outer brackets). */
function literal(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== "\\") {
      out += c;
      continue;
    }
    const n = s[++i];
    if (n === undefined) break;
    if (n === "n") out += "\n";
    else if (n === "r") out += "\r";
    else if (n === "t") out += "\t";
    else if (n === "b") out += "\b";
    else if (n === "f") out += "\f";
    else if (n === "\r" || n === "\n") {
      if (n === "\r" && s[i + 1] === "\n") i++;
    } else if (/[0-7]/.test(n)) {
      let oct = n;
      while (oct.length < 3 && /[0-7]/.test(s[i + 1] ?? "")) oct += s[++i];
      out += String.fromCharCode(parseInt(oct, 8) & 0xff);
    } else out += n; // \( \) \\ and anything else: the character itself
  }
  return out;
}

function* tokens(src: string): Generator<Token> {
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === " " || c === "\n" || c === "\r" || c === "\t" || c === "\f" || c === "\0") {
      i++;
    } else if (c === "%") {
      while (i < n && src[i] !== "\n" && src[i] !== "\r") i++;
    } else if (c === "(") {
      let depth = 1;
      let j = i + 1;
      for (; j < n && depth > 0; j++) {
        if (src[j] === "\\") j++;
        else if (src[j] === "(") depth++;
        else if (src[j] === ")") depth--;
      }
      yield { k: "str", v: literal(src.slice(i + 1, j - 1)) };
      i = j;
    } else if (c === "<" && src[i + 1] === "<") {
      i += 2; // dictionaries (marked content properties): skipped as tokens
    } else if (c === ">" && src[i + 1] === ">") {
      i += 2;
    } else if (c === "<") {
      const j = src.indexOf(">", i);
      const hex = src.slice(i + 1, j < 0 ? n : j).replace(/\s+/g, "");
      let v = "";
      for (let h = 0; h < hex.length; h += 2) v += String.fromCharCode(parseInt((hex.slice(h, h + 2) + "0").slice(0, 2), 16));
      yield { k: "str", v };
      i = j < 0 ? n : j + 1;
    } else if (c === "[") {
      yield { k: "open" };
      i++;
    } else if (c === "]") {
      yield { k: "close" };
      i++;
    } else if (c === "/") {
      let j = i + 1;
      while (j < n && !/[\s/\[\]()<>{}%]/.test(src[j])) j++;
      yield { k: "name", v: src.slice(i + 1, j) };
      i = j;
    } else {
      let j = i;
      while (j < n && !/[\s/\[\]()<>{}%]/.test(src[j])) j++;
      if (j === i) {
        i++;
        continue;
      }
      const word = src.slice(i, j);
      const num = Number(word);
      yield Number.isFinite(num) && /^[+-]?(\d+\.?\d*|\.\d+)$/.test(word) ? { k: "num", v: num } : { k: "op", v: word };
      i = j;
    }
  }
}

// ── Text runs ──────────────────────────────────────────────────────────

/** Every text object in one inflated content stream, with its page position. */
export function contentTextRuns(content: Buffer | string, stream = 0): PdfTextRun[] {
  const src = typeof content === "string" ? content : content.toString("latin1");
  if (!/\bBT\b/.test(src)) return [];
  const runs: PdfTextRun[] = [];
  const stack: Matrix[] = [];
  let ctm: Matrix = IDENTITY;
  let tm: Matrix = IDENTITY;
  let tlm: Matrix = IDENTITY;
  let leading = 0;
  let operands: Token[] = [];
  let array: Token[] | null = null;

  const nums = () => operands.filter((t): t is { k: "num"; v: number } => t.k === "num").map((t) => t.v);
  const emit = (text: string) => {
    if (!text) return;
    const p = mul(tm, ctm);
    runs.push({ stream, x: Math.round(p[4] * 100) / 100, y: Math.round(p[5] * 100) / 100, text });
  };
  const nextLine = (tx: number, ty: number) => {
    tlm = mul([1, 0, 0, 1, tx, ty], tlm);
    tm = tlm;
  };

  for (const tok of tokens(src)) {
    if (tok.k === "open") {
      array = [];
      continue;
    }
    if (tok.k === "close") {
      operands.push({ k: "str", v: joinTJ(array ?? []) });
      array = null;
      continue;
    }
    if (array) {
      array.push(tok);
      continue;
    }
    if (tok.k !== "op") {
      operands.push(tok);
      continue;
    }
    const nv = nums();
    switch (tok.v) {
      case "q":
        stack.push(ctm);
        break;
      case "Q":
        ctm = stack.pop() ?? IDENTITY;
        break;
      case "cm":
        if (nv.length >= 6) ctm = mul(nv.slice(-6) as Matrix, ctm);
        break;
      case "BT":
        tm = IDENTITY;
        tlm = IDENTITY;
        break;
      case "Tm":
        if (nv.length >= 6) {
          tm = nv.slice(-6) as Matrix;
          tlm = tm;
        }
        break;
      case "Td":
        if (nv.length >= 2) nextLine(nv[nv.length - 2], nv[nv.length - 1]);
        break;
      case "TD":
        if (nv.length >= 2) {
          leading = -nv[nv.length - 1];
          nextLine(nv[nv.length - 2], nv[nv.length - 1]);
        }
        break;
      case "TL":
        if (nv.length >= 1) leading = nv[nv.length - 1];
        break;
      case "T*":
        nextLine(0, -leading);
        break;
      case "Tj":
      case "TJ": {
        const s = operands.filter((t): t is { k: "str"; v: string } => t.k === "str").at(-1);
        if (s) emit(s.v);
        break;
      }
      case "'":
      case '"': {
        nextLine(0, -leading);
        const s = operands.filter((t): t is { k: "str"; v: string } => t.k === "str").at(-1);
        if (s) emit(s.v);
        break;
      }
      default:
        break;
    }
    operands = [];
  }
  return runs;
}

/** The text of a TJ array: its strings joined; a wide negative gap becomes a space. */
function joinTJ(items: Token[]): string {
  let out = "";
  for (const t of items) {
    if (t.k === "str") out += t.v;
    else if (t.k === "num" && t.v < -250 && out && !out.endsWith(" ")) out += " ";
  }
  return out;
}

/** All text runs of a PDF, stream by stream. */
export function pdfTextRuns(buf: Uint8Array): PdfTextRun[] {
  return pdfStreams(buf).flatMap((s, i) => contentTextRuns(s, i));
}

/**
 * Group text runs into lines: same stream, baselines within `tolerance`
 * points. Lines come top to bottom (per stream), cells left to right;
 * each cell is trimmed and empty cells dropped.
 */
export function pdfLines(runs: PdfTextRun[], tolerance = 2): string[][] {
  const byStream = new Map<number, PdfTextRun[]>();
  for (const r of runs) byStream.set(r.stream, [...(byStream.get(r.stream) ?? []), r]);
  const lines: string[][] = [];
  for (const stream of [...byStream.keys()].sort((a, b) => a - b)) {
    const sorted = (byStream.get(stream) ?? []).slice().sort((a, b) => b.y - a.y || a.x - b.x);
    let row: PdfTextRun[] = [];
    let rowY = Number.NaN;
    const flush = () => {
      const cells = row
        .sort((a, b) => a.x - b.x)
        .map((r) => r.text.replace(/\s+/g, " ").trim())
        .filter(Boolean);
      if (cells.length) lines.push(cells);
      row = [];
    };
    for (const r of sorted) {
      if (row.length && Math.abs(r.y - rowY) > tolerance) flush();
      if (!row.length) rowY = r.y;
      row.push(r);
    }
    flush();
  }
  return lines;
}
