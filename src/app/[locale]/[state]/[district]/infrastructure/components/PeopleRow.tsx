/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — who announced / executes a project, with attribution tooltips.
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */

"use client";

import MobileHint from "@/components/common/MobileHint";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { ANNOUNCER_TOOLTIP, PARTY_TOOLTIP } from "./infra-utils";

export default function PeopleRow({ p }: { p: InfraProject }) {
  const keyPeople = (p.keyPeople ?? []).filter((k): k is NonNullable<typeof k> => !!k && !!k.name);
  const hasAnything = !!p.announcedBy || !!p.executingAgency || keyPeople.length > 0;

  if (!hasAnything) {
    return (
      <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginBottom: 8 }}>
        👤 People &amp; agency data pending
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8, fontSize: 12, color: "#4B5563" }}>
      {/* Primary line: announced-by + party + executing agency — all in one */}
      <div>
        👤{" "}
        {p.announcedBy ? (
          <>
            <MobileHint hint={ANNOUNCER_TOOLTIP}>
              <span>
                Announced by:{" "}
                <strong style={{ color: "#1A1A1A" }}>{p.announcedBy}</strong>
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
          <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Announcer pending</span>
        )}
        {p.executingAgency && (
          <>
            {" · "}
            <span style={{ color: "#374151" }}>{p.executingAgency}</span>
          </>
        )}
      </div>
      {/* Secondary line: key people — inline, comma-separated */}
      {keyPeople.length > 0 && (
        <div style={{ fontSize: 11, color: "#6B7280" }}>
          Also:{" "}
          {keyPeople.slice(0, 3).map((kp, i) => (
            <span key={i}>
              {i > 0 ? ", " : ""}
              <strong style={{ color: "#374151" }}>{kp.name}</strong>
              {kp.role || kp.party ? ` (${[kp.role, kp.party].filter(Boolean).join(", ")})` : ""}
            </span>
          ))}
          {keyPeople.length > 3 && <span> + {keyPeople.length - 3} more</span>}
        </div>
      )}
    </div>
  );
}
