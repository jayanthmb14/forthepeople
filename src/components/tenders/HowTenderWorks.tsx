"use client";

// HowTenderWorks — the accordion of plain-English sections on the
// /tenders/how-it-works page, with an English / Kannada switch for the
// section bodies (the content comes from the database in both languages).
// The switch starts on the reader's site language. Kit Card + Chips,
// tokens only, 44 px tap targets, Lucide chevrons. The markdown renderer
// is unchanged; words around the content come from "page_tenders".

import type React from "react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Card, Chips } from "@/components/district/ui";

type Section = { slug: string; section: string; orderIndex: number; title: string; bodyMd: string; bodyKn: string | null; translationPending: boolean };

// Minimal markdown renderer — we deliberately keep this dependency-free to
// avoid pulling in a remark/rehype toolchain for three formatting types.
// Supports: **bold**, *italic*, inline `code`, line breaks, simple lists,
// pipe-tables, and paragraph splitting. Educational content only.
function renderMarkdown(md: string): React.ReactNode {
  const blocks = md.split(/\n\n+/);
  return blocks.map((b, i) => {
    if (/^\|.*\|/.test(b) && b.includes("\n")) {
      const lines = b.split("\n").filter((l) => l.trim().startsWith("|"));
      const [head, sep, ...rest] = lines;
      if (head && sep && /\|\s*-+\s*\|/.test(sep)) {
        const headers = head.split("|").map((s) => s.trim()).filter(Boolean);
        const rows = rest.map((r) => r.split("|").map((s) => s.trim()).filter(Boolean));
        return (
          <div key={i} style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>{headers.map((h, j) => <th key={j} style={{ textAlign: "left", padding: "6px 10px", background: "var(--ftp-surface-2)", borderBottom: "1px solid var(--ftp-border-strong)", fontWeight: 500 }}>{inline(h)}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} style={{ padding: "6px 10px", borderBottom: "1px solid var(--ftp-border)", verticalAlign: "top" }}>{inline(c)}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        );
      }
    }
    if (b.split("\n").every((l) => /^\d+\.\s/.test(l.trim()))) {
      return <ol key={i} style={{ paddingLeft: 22, margin: "8px 0", lineHeight: "22px" }}>{b.split("\n").map((l, j) => <li key={j}>{inline(l.replace(/^\d+\.\s*/, ""))}</li>)}</ol>;
    }
    if (b.split("\n").every((l) => /^[-*]\s/.test(l.trim()))) {
      return <ul key={i} style={{ paddingLeft: 22, margin: "8px 0", lineHeight: "22px" }}>{b.split("\n").map((l, j) => <li key={j}>{inline(l.replace(/^[-*]\s*/, ""))}</li>)}</ul>;
    }
    return <p key={i} style={{ margin: "10px 0", lineHeight: "22px" }}>{inline(b)}</p>;
  });
}

function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let k = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    const tok = match[0];
    if (tok.startsWith("**")) parts.push(<strong key={k++} style={{ fontWeight: 500 }}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={k++} style={{ background: "var(--ftp-surface-2)", padding: "1px 6px", borderRadius: 4, fontSize: "0.9em", fontFamily: "var(--ftp-font-mono)" }}>{tok.slice(1, -1)}</code>);
    else parts.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    lastIdx = match.index + tok.length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}


export default function HowTenderWorks({ sections }: { sections: Section[] }) {
  const t = useTranslations("page_tenders");
  const locale = useLocale();
  const [openSlug, setOpenSlug] = useState<string | null>(sections[0]?.slug ?? null);
  const [lang, setLang] = useState<"en" | "kn">(locale === "kn" ? "kn" : "en");

  return (
    <div>
      {/* Language switch (32 px chips, 44 px on phones). */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <Chips
          label={t("how.language")}
          items={[
            { value: "en", label: "English" },
            { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
          ]}
          value={lang}
          onChange={(v) => setLang(v as "en" | "kn")}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sections.map((s) => {
          const isOpen = openSlug === s.slug;
          const body = lang === "kn" && s.bodyKn ? s.bodyKn : s.bodyMd;
          const fallbackToEng = lang === "kn" && !s.bodyKn;
          const panelId = `how-${s.slug}`;
          return (
            <Card key={s.slug} padding={0} style={{ overflow: "hidden" }}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenSlug(isOpen ? null : s.slug)}
                style={{ width: "100%", minHeight: 44, padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontFamily: "var(--ftp-font-sans)" }}
              >
                <span className="ftp-title">
                  <span className="ftp-num" style={{ color: "var(--ftp-text-2)", marginRight: 10 }}>{s.orderIndex}.</span> {s.title}
                </span>
                <ChevronDown
                  size={18}
                  aria-hidden
                  style={{ color: "var(--ftp-text-2)", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : undefined }}
                />
              </button>
              {isOpen && (
                <div id={panelId} lang={fallbackToEng ? "en" : lang} style={{ padding: "0 16px 16px", fontSize: 13, lineHeight: "22px", color: "var(--ftp-text)", borderTop: "1px solid var(--ftp-border)" }}>
                  {fallbackToEng && (
                    <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-warn)", margin: "10px 0" }}>
                      {t("how.knPending")}
                    </p>
                  )}
                  {renderMarkdown(body)}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
