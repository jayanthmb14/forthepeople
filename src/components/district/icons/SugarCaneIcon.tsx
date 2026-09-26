/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — Mandya district icon (sugar cane).
 */
export interface DistrictIconProps {
  size?: number;
  className?: string;
  "aria-label"?: string;
}

export function SugarCaneIcon({ size = 20, className = "", ...rest }: DistrictIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? "Sugar cane — Mandya"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 3 vertical stalks */}
      <rect x="14" y="12" width="6" height="46" rx="2" fill="#84CC16" />
      <rect x="29" y="6" width="6" height="52" rx="2" fill="#65A30D" />
      <rect x="44" y="12" width="6" height="46" rx="2" fill="#84CC16" />
      {/* Segment lines */}
      <line x1="13" y1="22" x2="21" y2="22" stroke="#365314" strokeWidth="1.2" />
      <line x1="13" y1="32" x2="21" y2="32" stroke="#365314" strokeWidth="1.2" />
      <line x1="13" y1="42" x2="21" y2="42" stroke="#365314" strokeWidth="1.2" />
      <line x1="13" y1="52" x2="21" y2="52" stroke="#365314" strokeWidth="1.2" />
      <line x1="28" y1="16" x2="36" y2="16" stroke="#365314" strokeWidth="1.2" />
      <line x1="28" y1="26" x2="36" y2="26" stroke="#365314" strokeWidth="1.2" />
      <line x1="28" y1="36" x2="36" y2="36" stroke="#365314" strokeWidth="1.2" />
      <line x1="28" y1="46" x2="36" y2="46" stroke="#365314" strokeWidth="1.2" />
      <line x1="43" y1="22" x2="51" y2="22" stroke="#365314" strokeWidth="1.2" />
      <line x1="43" y1="32" x2="51" y2="32" stroke="#365314" strokeWidth="1.2" />
      <line x1="43" y1="42" x2="51" y2="42" stroke="#365314" strokeWidth="1.2" />
      <line x1="43" y1="52" x2="51" y2="52" stroke="#365314" strokeWidth="1.2" />
      {/* Leaves */}
      <path d="M17 12 Q11 6 6 9 Q11 11 17 12 Z" fill="#16A34A" />
      <path d="M17 12 Q23 6 28 9 Q23 11 17 12 Z" fill="#16A34A" />
      <path d="M32 6 Q26 0 21 3 Q26 5 32 6 Z" fill="#16A34A" />
      <path d="M32 6 Q38 0 43 3 Q38 5 32 6 Z" fill="#16A34A" />
      <path d="M47 12 Q41 6 36 9 Q41 11 47 12 Z" fill="#16A34A" />
      <path d="M47 12 Q53 6 58 9 Q53 11 47 12 Z" fill="#16A34A" />
    </svg>
  );
}
