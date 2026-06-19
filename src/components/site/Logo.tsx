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
      {/* Background */}
      <rect width="48" height="48" rx="11" fill="#4a0014" />

      {/* Subtle inner glow */}
      <circle cx="24" cy="24" r="13" fill="rgba(212,168,87,0.07)" />

      {/* Top sync arc — bright gold */}
      <path
        d="M8 24 A16 16 0 0 1 40 24"
        stroke="#d4a857"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Arrowhead at top arc end (40,24) — pointing downward (clockwise) */}
      <path
        d="M36.5 17.5 L40 24 L34 24.8"
        stroke="#d4a857"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom sync arc — deeper gold */}
      <path
        d="M40 24 A16 16 0 0 1 8 24"
        stroke="#c49040"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Arrowhead at bottom arc end (8,24) — pointing upward (clockwise) */}
      <path
        d="M11.5 30.5 L8 24 L14 23.2"
        stroke="#c49040"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Valley mountain silhouette inside the sync circle */}
      <path
        d="M14 35 L21 24 L24.5 29 L28.5 22 L34 35"
        stroke="rgba(245,240,232,0.52)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
