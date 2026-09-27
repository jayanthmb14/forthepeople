/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Pieces of "Helplines & your rights" (citizen-corner):
//   HELPLINES / KINDS   the national helplines, grouped by need
//   HelplineCard        big tap-to-call card + an "i" button for details
//   HelplineSheet       when to call, what to say, a big Call button
//   RIGHTS / RightCard  one right as a picture card
//   RightSheet          the plain-language explanation, 3 steps to use it,
//                       the law, the official website and our related page
// Text: "page_citizen-corner" namespace (helplines.<key>.*, rights.<id>.*).
"use client";

import { useTranslations } from "next-intl";
import { ChevronRight, Globe, Info, Phone } from "lucide-react";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { useModuleText } from "@/i18n/client";
import { hueClass } from "@/lib/design/hues";
import { getStateConfig } from "@/lib/constants/state-config";

export type HelplineKind = "emergency" | "care" | "complaints" | "farmers";
export const KINDS: Array<{ id: HelplineKind; emoji: string }> = [
  { id: "emergency", emoji: "🚨" },
  { id: "care", emoji: "🛡️" },
  { id: "complaints", emoji: "📢" },
  { id: "farmers", emoji: "🌾" },
];

/** National helplines. The name and "when to call" are messages (helplines.<key>.*). */
export const HELPLINES: { key: string; number: string; emoji: string; kind: HelplineKind }[] = [
  { key: "national", number: "112", emoji: "🆘", kind: "emergency" },
  { key: "police", number: "100", emoji: "🚓", kind: "emergency" },
  { key: "ambulance", number: "108", emoji: "🚑", kind: "emergency" },
  { key: "fire", number: "101", emoji: "🚒", kind: "emergency" },
  { key: "road", number: "1073", emoji: "🚗", kind: "emergency" },
  { key: "women", number: "1091", emoji: "👩", kind: "care" },
  { key: "child", number: "1098", emoji: "🧒", kind: "care" },
  { key: "senior", number: "14567", emoji: "👵", kind: "care" },
  { key: "cyber", number: "1930", emoji: "💻", kind: "complaints" },
  { key: "corruption", number: "1064", emoji: "🧾", kind: "complaints" },
  { key: "consumer", number: "1800-11-4000", emoji: "🛒", kind: "complaints" },
  { key: "pmkisan", number: "155261", emoji: "🌾", kind: "farmers" },
];

export interface Right {
  id: string;
  emoji: string;
  /** Official website, when there is one national site. */
  site?: string;
  /** Our page that helps with it (module slug). */
  module?: string;
  /** Extra value for the description (the city corporation's name). */
  body?: string;
}

/** The rights shown, with the local-government one picked for the state. */
export function getRights(stateSlug: string): Right[] {
  const sc = getStateConfig(stateSlug);
  const isUrban = sc ? !sc.gramPanchayatApplicable : false;
  const local: Right = isUrban
    ? { id: sc?.municipalBody ? "wardBody" : "ward", emoji: "🏙️", body: sc?.municipalBody ?? undefined }
    : { id: "gramSabha", emoji: "🏡", module: "gram-panchayat" };
  return [
    { id: "rti", emoji: "📄", site: "https://rtionline.gov.in", module: "file-rti" },
    { id: "food", emoji: "🍚", site: "https://nfsa.gov.in", module: "schemes" },
    { id: "education", emoji: "🎒", module: "schools" },
    { id: "mgnrega", emoji: "⛏️", site: "https://nrega.nic.in", module: "schemes" },
    local,
    { id: "consumer", emoji: "🛒", site: "https://consumerhelpline.gov.in" },
  ];
}

const SHEET_HUE = hueClass("citizen-corner");
const STEPS = ["step1", "step2", "step3"] as const;

/** Surface shared by the helpline and rights cards. */
const TINTED: React.CSSProperties = {
  background: "linear-gradient(135deg, color-mix(in srgb, var(--hue) 7%, #fff) 0%, #fff 70%)",
  border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
  borderRadius: "var(--ftp-radius-card)",
  boxShadow: "var(--ftp-shadow-1)",
};

function SheetLink({ href, icon: Icon, children, primary }: { href: string; icon: typeof Phone; children: React.ReactNode; primary?: boolean }) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{
        flex: "1 1 150px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 48,
        padding: "0 16px",
        borderRadius: 12,
        border: `1px solid ${primary ? "var(--hue)" : "var(--ftp-border)"}`,
        background: primary ? "var(--hue)" : "var(--ftp-surface)",
        color: primary ? "#fff" : "var(--ftp-text)",
        fontSize: 16,
        fontWeight: 650,
        textDecoration: "none",
      }}
    >
      <Icon size={18} aria-hidden />
      {children}
    </a>
  );
}

// ── Helplines ───────────────────────────────────────────────────────────

export function HelplineCard({ h, onInfo }: { h: (typeof HELPLINES)[number]; onInfo: () => void }) {
  const t = useTranslations("page_citizen-corner");
  const name = t(`helplines.${h.key}.name`);
  return (
    <div style={{ ...TINTED, display: "flex", alignItems: "stretch", minWidth: 0 }}>
      <a
        href={`tel:${h.number.replace(/[^\d+]/g, "")}`}
        className="ftp-card-link"
        aria-label={t("callAria", { name, number: h.number })}
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 12px 14px 14px",
          minHeight: 72,
          textDecoration: "none",
          color: "var(--ftp-text)",
          borderRadius: "var(--ftp-radius-card) 0 0 var(--ftp-radius-card)",
        }}
      >
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 48, height: 48, fontSize: 26, borderRadius: 14, background: "#fff" }}>
          {h.emoji}
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="ftp-bignum" style={{ display: "block", fontSize: h.number.length > 6 ? 18 : 26, lineHeight: 1.15, color: "var(--hue-deep)", overflowWrap: "anywhere" }}>
            {h.number}
          </span>
          <span style={{ display: "block", fontSize: 14, lineHeight: "19px", fontWeight: 600 }}>{name}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }}>
            <Phone size={12} aria-hidden />
            {t("tapToCall")}
          </span>
        </span>
      </a>
      <button
        type="button"
        onClick={onInfo}
        aria-haspopup="dialog"
        aria-label={t("infoAria", { name })}
        style={{
          width: 48,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderInlineStart: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))",
          background: "transparent",
          color: "var(--hue-deep)",
          cursor: "pointer",
          borderRadius: "0 var(--ftp-radius-card) var(--ftp-radius-card) 0",
        }}
      >
        <Info size={20} aria-hidden />
      </button>
    </div>
  );
}

export function HelplineSheet({ h, onClose }: { h: (typeof HELPLINES)[number] | null; onClose: () => void }) {
  const t = useTranslations("page_citizen-corner");
  if (!h) return null;
  const name = t(`helplines.${h.key}.name`);
  const group = KINDS.find((k) => k.id === h.kind);
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={name}
      subtitle={<span className="ftp-num">{h.number}</span>}
      emoji={h.emoji}
      hueClassName={SHEET_HUE}
      footer={
        <SheetLink href={`tel:${h.number.replace(/[^\d+]/g, "")}`} icon={Phone} primary>
          {t("callNumber", { number: h.number })}
        </SheetLink>
      }
    >
      <div style={{ padding: "12px 14px", borderRadius: 14, background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)", border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))" }}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>
          <span aria-hidden>🕒 </span>
          {t("whenToCall")}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 16, lineHeight: "24px" }}>{t(`helplines.${h.key}.when`)}</p>
      </div>
      <DetailList
        rows={[
          { emoji: "☎️", label: t("number"), value: <span className="ftp-num" style={{ fontSize: 18, fontWeight: 700 }}>{h.number}</span> },
          { emoji: group?.emoji, label: t("group"), value: t(`kinds.${h.kind}`) },
        ]}
      />
      <p style={{ margin: 0, fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>
        <span aria-hidden>💬 </span>
        {h.kind === "emergency" ? t("sayEmergency") : t("sayOther")}
      </p>
      <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("checkNote")}</p>
    </DetailSheet>
  );
}

// ── Rights ──────────────────────────────────────────────────────────────

export function RightCard({ r, onOpen }: { r: Right; onOpen: () => void }) {
  const t = useTranslations("page_citizen-corner");
  return (
    <button
      type="button"
      onClick={onOpen}
      className="ftp-card-link"
      aria-haspopup="dialog"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: "100%",
        padding: 0,
        textAlign: "left",
        font: "inherit",
        color: "var(--ftp-text)",
        cursor: "pointer",
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        overflow: "hidden",
      }}
    >
      {/* The picture: a big emoji on a band of the page hue. */}
      <span
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 88,
          background: "radial-gradient(160px 90px at 80% 0%, rgba(255,255,255,0.35), transparent 70%), linear-gradient(135deg, var(--hue-pop) 0%, var(--hue) 100%)",
        }}
      >
        <span className="ftp-emoji" style={{ fontSize: 44, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))" }}>
          {r.emoji}
        </span>
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 6, padding: 14, flex: 1 }}>
        <span className="ftp-display" style={{ fontSize: 17, lineHeight: "22px", fontWeight: 650 }}>
          {t(`rights.${r.id}.title`)}
        </span>
        <span style={{ fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t(`rights.${r.id}.desc`, { body: r.body ?? "" })}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, alignSelf: "flex-end", marginTop: "auto", fontSize: 13, fontWeight: 600, color: "var(--hue-deep)" }}>
          {t("readMore")}
          <ChevronRight size={14} aria-hidden />
        </span>
      </span>
    </button>
  );
}

export function RightSheet({ r, onClose, base }: { r: Right | null; onClose: () => void; base: string }) {
  const t = useTranslations("page_citizen-corner");
  const mt = useModuleText();
  if (!r) return null;
  const footer =
    r.site || r.module ? (
      <>
        {r.site && (
          <SheetLink href={r.site} icon={Globe} primary>
            {t("officialSite")}
          </SheetLink>
        )}
        {r.module && (
          <SheetLink href={`${base}/${r.module}`} icon={ChevronRight} primary={!r.site}>
            {t("openPage", { page: mt.label(r.module) })}
          </SheetLink>
        )}
      </>
    ) : undefined;
  return (
    <DetailSheet open onClose={onClose} title={t(`rights.${r.id}.title`)} emoji={r.emoji} hueClassName={SHEET_HUE} footer={footer}>
      <div style={{ padding: "12px 14px", borderRadius: 14, background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)", border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))" }}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>
          <span aria-hidden>💡 </span>
          {t("whatItMeans")}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 15, lineHeight: "23px" }}>{t(`rights.${r.id}.more`, { body: r.body ?? "" })}</p>
      </div>
      <section>
        <h3 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 16, lineHeight: "22px", fontWeight: 650 }}>
          <span aria-hidden>✅ </span>
          {t("howToUse")}
        </h3>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {STEPS.map((k, i) => (
            <li key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15, lineHeight: "22px" }}>
              <span
                aria-hidden
                className="ftp-num"
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--hue)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <span>{t(`rights.${r.id}.${k}`)}</span>
            </li>
          ))}
        </ol>
      </section>
      <DetailList rows={[{ emoji: "📜", label: t("law"), value: t(`rights.${r.id}.law`) }]} />
      <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("rightsNote")}</p>
    </DetailSheet>
  );
}
