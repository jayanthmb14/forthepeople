/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use, useState } from "react";
import { FileText, Copy, Check, ExternalLink } from "lucide-react";
import { useRTI } from "@/hooks/useRealtimeData";
import { ModuleHeader, SectionLabel, LoadingShell, ErrorBlock } from "@/components/district/ui";

export default function FileRTIPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useRTI(district, state);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const templates = (data?.data?.templates ?? []).filter((t) => t.active);
  const selectedTpl = templates.find((t) => t.id === selected);

  const handleCopy = () => {
    if (selectedTpl) {
      navigator.clipboard.writeText(selectedTpl.templateText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={FileText} title="File RTI" description="Choose a template, copy the application text, and submit online" backHref={base} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 16 }}>
          {/* Template list */}
          <div>
            <SectionLabel>Choose Topic</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {templates.map((t) => (
                <button key={t.id} onClick={() => setSelected(t.id === selected ? null : t.id)} style={{
                  padding: "12px 14px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                  background: selected === t.id ? "#EFF6FF" : "#FFF",
                  border: selected === t.id ? "1px solid #2563EB" : "1px solid #E8E8E4",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{t.topic}</div>
                  {t.topicLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{t.topicLocal}</div>}
                  <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>PIO: {t.department}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#9B9B9B", background: "#F5F5F0", padding: "2px 7px", borderRadius: 8 }}>Fee: ₹{String(t.feeAmount ?? "").replace(/^\s*(₹|Rs\.?)\s*/i, "") || "0"}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected template */}
          {selectedTpl && (
            <div>
              <SectionLabel>RTI Application</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 4 }}>To:</div>
                  <div style={{ fontSize: 13, color: "#4B4B4B", lineHeight: 1.5 }}>{selectedTpl.pioName && `${selectedTpl.pioName},\n`}{selectedTpl.pioAddress}</div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", marginBottom: 4 }}>APPLICATION TEXT</div>
                  <div style={{ background: "#F9F9F7", borderRadius: 8, padding: 12, fontSize: 13, color: "#1A1A1A", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", maxHeight: 280, overflowY: "auto" }}>
                    {selectedTpl.templateText}
                  </div>
                </div>

                {selectedTpl.templateTextLocal && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", marginBottom: 4 }}>ಕನ್ನಡದಲ್ಲಿ</div>
                    <div style={{ background: "#F9F9F7", borderRadius: 8, padding: 12, fontSize: 13, color: "#4B4B4B", lineHeight: 1.7, fontFamily: "var(--font-regional)", maxHeight: 160, overflowY: "auto" }}>
                      {selectedTpl.templateTextLocal}
                    </div>
                  </div>
                )}

                {selectedTpl.tips && (
                  <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#92400E", marginBottom: 2 }}>TIP</div>
                    <div style={{ fontSize: 12, color: "#78350F" }}>{selectedTpl.tips}</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={handleCopy} style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
                    background: copied ? "#16A34A" : "#2563EB", color: "#FFF", borderRadius: 8,
                    fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                  }}>
                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Text</>}
                  </button>
                  <a href="https://rtionline.gov.in" target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
                    background: "#F5F5F0", color: "#1A1A1A", borderRadius: 8,
                    fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1px solid #E8E8E4",
                  }}>
                    File Online <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
