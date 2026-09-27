/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — who announced / executes a project, with attribution tooltips.
 * Design v3: Lucide User icon, token colours, weight 500 for names.
 */

"use client";

import { User } from "lucide-react";
import MobileHint from "@/components/common/MobileHint";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { ANNOUNCER_TOOLTIP, PARTY_TOOLTIP } from "./infra-utils";

const NAME: React.CSSProperties = { fontWeight: 500, color: "var(--ftp-text)" };

export default function PeopleRow({ p }: { p: InfraProject }) {
  const keyPeople = (p.keyPeople ?? []).filter((k): k is NonNullable<typeof k> => !!k && !!k.name);
  const hasAnything = !!p.announcedBy || !!p.executingAgency || keyPeople.length > 0;

  if (!hasAnything) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginBottom: 8 }}>
        <User size={14} aria-hidden /> People &amp; agency data pending
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
      {/* Primary line: announced-by + party + executing agency — all in one */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <User size={14} aria-hidden style={{ flexShrink: 0, marginTop: 3 }} />
        <span>
          {p.announcedBy ? (
            <>
              <MobileHint hint={ANNOUNCER_TOOLTIP}>
                <span>
                  Announced by:{" "}
                  <span style={NAME}>{p.announcedBy}</span>
                </span>
              </MobileHint>
              {p.party ? (
                <>
                  {" "}
                  <MobileHint hint={PARTY_TOOLTIP}>
                    <span>({p.party})</span>
                  </MobileHint>
                </>
              ) : ""}
            </>
          ) : (
            <span>Announcer pending</span>
          )}
          {p.executingAgency && (
            <>
              {" · "}
              <span style={{ color: "var(--ftp-text)" }}>{p.executingAgency}</span>
            </>
          )}
        </span>
      </div>
      {/* Secondary line: key people — inline, comma-separated */}
      {keyPeople.length > 0 && (
        <div style={{ fontSize: 11, lineHeight: "16px", paddingLeft: 20 }}>
          Also:{" "}
          {keyPeople.slice(0, 3).map((kp, i) => (
            <span key={i}>
              {i > 0 ? ", " : ""}
              <span style={NAME}>{kp.name}</span>
              {kp.role || kp.party ? ` (${[kp.role, kp.party].filter(Boolean).join(", ")})` : ""}
            </span>
          ))}
          {keyPeople.length > 3 && <span> + <span className="ftp-num">{keyPeople.length - 3}</span> more</span>}
        </div>
      )}
    </div>
  );
}
