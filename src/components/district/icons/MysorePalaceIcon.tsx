/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — Mysuru district icon (Mysore Palace).
 */
import type { DistrictIconProps } from "./SugarCaneIcon";

export function MysorePalaceIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "Mysore Palace — Mysuru"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main palace body */}
      <rect x="10" y="32" width="44" height="24" fill="#FF6347" />
      {/* Door + window slots */}
      <rect x="14" y="40" width="6" height="16" fill="#8B0000" />
      <rect x="44" y="40" width="6" height="16" fill="#8B0000" />
      <rect x="29" y="40" width="6" height="16" fill="#8B0000" />
      {/* Roof / dome */}
      <path d="M10 32 L32 16 L54 32 Z" fill="#FFD700" />
      <circle cx="32" cy="22" r="3" fill="#FF6347" />
      {/* Pinnacle */}
      <line x1="32" y1="14" x2="32" y2="20" stroke="#8B4513" strokeWidth="1.2" />
      {/* Base step */}
      <rect x="6" y="56" width="52" height="3" fill="#5D2F0E" />
    </svg>
  );
}
