/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — who announced / executes a project, with attribution tooltips.
 * Lucide User icon, token colours, weight 500 for names. Names, parties
 * and agencies are shown as published; the words around them are
 * translated. The announcer and the agency sit side by side as two items
 * (no "·"-joined string).
 */

"use client";

import { User } from "lucide-react";
import MobileHint from "@/components/common/MobileHint";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { useInfraText } from "./infra-i18n";

const NAME: React.CSSProperties = { fontWeight: 500, color: "var(--ftp-text)" };
const name = (c: React.ReactNode) => <span style={NAME}>{c}</span>;

export default function PeopleRow({ p }: { p: InfraProject }) {
  const { t, m } = useInfraText();
  const keyPeople = (p.keyPeople ?? []).filter((k): k is NonNullable<typeof k> => !!k && !!k.name);
  const hasAnything = !!p.announcedBy || !!p.executingAgency || keyPeople.length > 0;

  if (!hasAnything) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginBottom: 8 }}>
        <User size={14} aria-hidden /> {t("people.pending")}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
      {/* Primary line: announced-by + party, then the executing agency */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <User size={14} aria-hidden style={{ flexShrink: 0, marginTop: 3 }} />
        <span style={{ display: "inline-flex", flexWrap: "wrap", columnGap: 12, rowGap: 2 }}>
          {p.announcedBy ? (
            <span>
              <MobileHint hint={t("people.announcerHint")}>
                <span>{t.rich("people.announcedBy", { who: p.announcedBy, name })}</span>
              </MobileHint>
              {p.party ? (
                <>
                  {" "}
                  <MobileHint hint={t("people.partyHint")}>
                    <span>({p.party})</span>
                  </MobileHint>
                </>
              ) : null}
            </span>
          ) : (
            <span>{t("people.announcerPending")}</span>
          )}
          {p.executingAgency && <span style={{ color: "var(--ftp-text)" }}>{p.executingAgency}</span>}
        </span>
      </div>
      {/* Secondary line: key people — inline, comma-separated */}
      {keyPeople.length > 0 && (
        <div style={{ fontSize: 11, lineHeight: "16px", paddingLeft: 20 }}>
          {t("people.also")}{" "}
          {keyPeople.slice(0, 3).map((kp, i) => (
            <span key={i}>
              {i > 0 ? ", " : ""}
              <span style={NAME}>{kp.name}</span>
              {kp.role || kp.party ? ` (${[kp.role, kp.party].filter(Boolean).join(", ")})` : ""}
            </span>
          ))}
          {keyPeople.length > 3 && <span> {t("people.more", { n: m.num(keyPeople.length - 3) })}</span>}
        </div>
      )}
    </div>
  );
}
