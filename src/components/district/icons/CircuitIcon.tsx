/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — Bengaluru district icon (silicon-valley circuit motif).
 */
import type { DistrictIconProps } from "./SugarCaneIcon";

export function CircuitIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "Circuit — Bengaluru tech hub"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer trace square */}
      <rect x="14" y="14" width="36" height="36" rx="3" fill="none" stroke="#10B981" strokeWidth="2" />
      {/* Corner pads */}
      <circle cx="22" cy="22" r="2.5" fill="#10B981" />
      <circle cx="42" cy="22" r="2.5" fill="#10B981" />
      <circle cx="22" cy="42" r="2.5" fill="#10B981" />
      <circle cx="42" cy="42" r="2.5" fill="#10B981" />
      {/* Inner traces */}
      <line x1="22" y1="22" x2="42" y2="22" stroke="#10B981" strokeWidth="1.5" />
      <line x1="22" y1="42" x2="42" y2="42" stroke="#10B981" strokeWidth="1.5" />
      <line x1="22" y1="22" x2="22" y2="42" stroke="#10B981" strokeWidth="1.5" />
      <line x1="42" y1="22" x2="42" y2="42" stroke="#10B981" strokeWidth="1.5" />
      {/* CPU die at center */}
      <rect x="28" y="28" width="8" height="8" fill="#059669" rx="1" />
      <rect x="30" y="30" width="4" height="4" fill="#A7F3D0" rx="0.5" />
      {/* External pins */}
      <line x1="32" y1="14" x2="32" y2="9" stroke="#10B981" strokeWidth="1.5" />
      <line x1="32" y1="50" x2="32" y2="55" stroke="#10B981" strokeWidth="1.5" />
      <line x1="14" y1="32" x2="9" y2="32" stroke="#10B981" strokeWidth="1.5" />
      <line x1="50" y1="32" x2="55" y2="32" stroke="#10B981" strokeWidth="1.5" />
    </svg>
  );
}
