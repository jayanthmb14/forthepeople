/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — New Delhi district icon (India Gate).
 */
import type { DistrictIconProps } from "./SugarCaneIcon";

export function IndiaGateIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "India Gate — New Delhi"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main arch silhouette */}
      <path
        d="M14 56 L14 24 Q14 14 32 14 Q50 14 50 24 L50 56 L42 56 L42 26 Q42 22 32 22 Q22 22 22 26 L22 56 Z"
        fill="#C19A6B"
      />
      {/* Base step */}
      <rect x="10" y="56" width="44" height="4" fill="#8B6F47" />
      {/* Crown ornament */}
      <circle cx="32" cy="14" r="2.5" fill="#FFD700" />
      <line x1="32" y1="11.5" x2="32" y2="8" stroke="#8B4513" strokeWidth="1.2" />
    </svg>
  );
}
