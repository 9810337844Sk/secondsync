export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="ss-bg" cx="32%" cy="22%" r="75%">
          <stop offset="0%" stopColor="#6a001e" />
          <stop offset="100%" stopColor="#19000a" />
        </radialGradient>
        <clipPath id="ss-clip">
          <rect width="48" height="48" rx="11" />
        </clipPath>
      </defs>

      {/* Badge */}
      <rect width="48" height="48" rx="11" fill="url(#ss-bg)" />

      {/* Top-left gloss */}
      <ellipse
        cx="15" cy="10" rx="14" ry="7"
        fill="rgba(255,255,255,0.055)"
        clipPath="url(#ss-clip)"
      />

      {/* Hairline framing ring */}
      <circle cx="24" cy="24" r="14" stroke="#d4a857" strokeWidth="0.5" strokeOpacity="0.22" />

      {/*
        ── Upper C-arrow ────────────────────────────────────────────
        Circle center (24, 20), radius 9.5.
        Sweeps CLOCKWISE from left (14.5, 20) → via top (24, 10.5) → to right (33.5, 20).
        At the right end the clockwise tangent points DOWNWARD → arrowhead faces down.
      */}
      <path
        d="M 14.5 20 A 9.5 9.5 0 0 1 33.5 20"
        stroke="#d4a857"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead: tip (33.5,26), wings (29.5,17) & (37.5,17) */}
      <polygon points="33.5,26 29.5,17 37.5,17" fill="#d4a857" />

      {/*
        ── Lower C-arrow ────────────────────────────────────────────
        Circle center (24, 28), radius 9.5.
        Sweeps CLOCKWISE from right (33.5, 28) → via bottom (24, 37.5) → to left (14.5, 28).
        At the left end the clockwise tangent points UPWARD → arrowhead faces up.
      */}
      <path
        d="M 33.5 28 A 9.5 9.5 0 0 1 14.5 28"
        stroke="#bf7c22"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead: tip (14.5,22), wings (11,31) & (18,31) */}
      <polygon points="14.5,22 11,31 18,31" fill="#bf7c22" />
    </svg>
  );
}
