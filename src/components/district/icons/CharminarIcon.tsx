/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — Hyderabad district icon (Charminar minarets).
 */
import type { DistrictIconProps } from "./SugarCaneIcon";

export function CharminarIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "Charminar — Hyderabad"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central building */}
      <rect x="20" y="38" width="24" height="22" rx="1" fill="#D4A574" />
      <rect x="22" y="44" width="6" height="16" fill="#8B4513" />
      <rect x="36" y="44" width="6" height="16" fill="#8B4513" />
      {/* Side minarets */}
      <rect x="11" y="36" width="6" height="22" fill="#D4A574" />
      <rect x="47" y="36" width="6" height="22" fill="#D4A574" />
      <circle cx="14" cy="36" r="3" fill="#D4A574" />
      <circle cx="50" cy="36" r="3" fill="#D4A574" />
      {/* Domes */}
      <circle cx="14" cy="20" r="4" fill="#B8860B" />
      <circle cx="50" cy="20" r="4" fill="#B8860B" />
      <path d="M22 38 L32 26 L42 38 Z" fill="#B8860B" />
      {/* Pinnacles */}
      <line x1="14" y1="16" x2="14" y2="13" stroke="#8B4513" strokeWidth="1.2" />
      <line x1="50" y1="16" x2="50" y2="13" stroke="#8B4513" strokeWidth="1.2" />
    </svg>
  );
}
