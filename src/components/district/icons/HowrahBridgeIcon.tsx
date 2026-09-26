/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — Kolkata district icon (Howrah Bridge).
 */
import type { DistrictIconProps } from "./SugarCaneIcon";

export function HowrahBridgeIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "Howrah Bridge — Kolkata"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cantilever cables — V shape */}
      <path d="M4 44 L32 16 L60 44" stroke="#8B7765" strokeWidth="3" fill="none" strokeLinejoin="round" />
      {/* Deck */}
      <line x1="4" y1="44" x2="60" y2="44" stroke="#5D4E3F" strokeWidth="3" />
      {/* Vertical hangers */}
      <line x1="32" y1="16" x2="32" y2="44" stroke="#8B7765" strokeWidth="2" />
      <line x1="18" y1="30" x2="18" y2="44" stroke="#8B7765" strokeWidth="1.5" />
      <line x1="46" y1="30" x2="46" y2="44" stroke="#8B7765" strokeWidth="1.5" />
      {/* Roadway base */}
      <rect x="2" y="44" width="60" height="3" fill="#3D2E1F" />
      {/* Water hint */}
      <line x1="4" y1="52" x2="14" y2="52" stroke="#60A5FA" strokeWidth="1" opacity="0.6" />
      <line x1="20" y1="55" x2="32" y2="55" stroke="#60A5FA" strokeWidth="1" opacity="0.6" />
      <line x1="38" y1="52" x2="50" y2="52" stroke="#60A5FA" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
