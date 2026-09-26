/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — Chennai district icon (Kapaleeshwarar gopuram).
 */
import type { DistrictIconProps } from "./SugarCaneIcon";

export function MarinaTempleIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "Temple gopuram — Chennai"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stepped pyramid (gopuram) — narrower as it goes up */}
      <rect x="20" y="48" width="24" height="10" fill="#DDA15E" />
      <rect x="22" y="40" width="20" height="8" fill="#BC6C25" />
      <rect x="24" y="32" width="16" height="8" fill="#DDA15E" />
      <rect x="26" y="24" width="12" height="8" fill="#BC6C25" />
      <rect x="28" y="16" width="8" height="8" fill="#DDA15E" />
      {/* Crowning kalasham */}
      <path d="M28 16 L32 8 L36 16 Z" fill="#FFB627" />
      {/* Base step */}
      <rect x="16" y="58" width="32" height="2" fill="#5D4E3F" />
      {/* Decorative dots on each tier (sculpted figures) */}
      <circle cx="28" cy="44" r="0.8" fill="#5D4E3F" />
      <circle cx="32" cy="44" r="0.8" fill="#5D4E3F" />
      <circle cx="36" cy="44" r="0.8" fill="#5D4E3F" />
    </svg>
  );
}
