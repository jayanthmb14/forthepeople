/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — Lucknow district icon (Bara Imambara).
 */
import type { DistrictIconProps } from "./SugarCaneIcon";

export function ImambaraIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "Bara Imambara — Lucknow"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main facade */}
      <rect x="8" y="32" width="48" height="24" fill="#E0C9A6" />
      {/* Onion-dome roof */}
      <path d="M8 32 Q32 14 56 32 Z" fill="#C9A66B" />
      {/* Three arched portals */}
      <rect x="14" y="40" width="6" height="16" fill="#8B7355" />
      <rect x="29" y="40" width="6" height="16" fill="#8B7355" />
      <rect x="44" y="40" width="6" height="16" fill="#8B7355" />
      {/* Gold finial */}
      <circle cx="32" cy="22" r="2.5" fill="#FFD700" />
      <line x1="32" y1="20" x2="32" y2="16" stroke="#8B4513" strokeWidth="1" />
      {/* Base step */}
      <rect x="4" y="56" width="56" height="3" fill="#8B7355" />
    </svg>
  );
}
