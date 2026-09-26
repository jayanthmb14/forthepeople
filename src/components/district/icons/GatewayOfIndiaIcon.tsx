/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — Mumbai district icon (Gateway of India).
 */
import type { DistrictIconProps } from "./SugarCaneIcon";

export function GatewayOfIndiaIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "Gateway of India — Mumbai"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer arch */}
      <path d="M14 56 L14 30 Q14 18 32 18 Q50 18 50 30 L50 56 Z" fill="#A0826D" />
      {/* Inner archway */}
      <path d="M22 56 L22 38 Q22 30 32 30 Q42 30 42 38 L42 56 Z" fill="#7F6F65" />
      {/* Side towers */}
      <rect x="10" y="20" width="6" height="36" fill="#A0826D" />
      <rect x="48" y="20" width="6" height="36" fill="#A0826D" />
      <circle cx="13" cy="20" r="3" fill="#8B4513" />
      <circle cx="51" cy="20" r="3" fill="#8B4513" />
      {/* Base */}
      <rect x="6" y="56" width="52" height="3" fill="#5D4E3F" />
    </svg>
  );
}
