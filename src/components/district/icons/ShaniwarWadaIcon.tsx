/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — Pune district icon (Shaniwar Wada fortress).
 */
import type { DistrictIconProps } from "./SugarCaneIcon";

export function ShaniwarWadaIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "Shaniwar Wada — Pune"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer fort wall */}
      <rect x="10" y="36" width="44" height="20" fill="#8B4513" />
      {/* Crenellations on top */}
      <rect x="10" y="32" width="6" height="4" fill="#8B4513" />
      <rect x="20" y="32" width="6" height="4" fill="#8B4513" />
      <rect x="30" y="32" width="6" height="4" fill="#8B4513" />
      <rect x="40" y="32" width="6" height="4" fill="#8B4513" />
      <rect x="48" y="32" width="6" height="4" fill="#8B4513" />
      {/* Arched gateway */}
      <rect x="26" y="42" width="12" height="14" fill="#3D1F0E" />
      <path d="M26 42 Q32 36 38 42" fill="#3D1F0E" />
      {/* Side towers */}
      <rect x="14" y="42" width="6" height="14" fill="#5D2F0E" />
      <rect x="44" y="42" width="6" height="14" fill="#5D2F0E" />
      {/* Top spire */}
      <path d="M14 32 L32 22 L50 32 Z" fill="#A0522D" />
      <circle cx="32" cy="28" r="2" fill="#FFD700" />
    </svg>
  );
}
