/**
 * 로그인 전용: 멘토 인물 + 노트북 + 식물·말풍선 (flat illustration)
 */
export function LoginMentorHeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="lgi-men-bg" x1="0" y1="0" x2="420" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecfdf5" />
          <stop offset="0.5" stopColor="#d1fae5" />
          <stop offset="1" stopColor="#a7f3d0" />
        </linearGradient>
        <linearGradient id="lgi-men-sweater" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <filter id="lgi-men-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#064e3b" floodOpacity="0.1" />
        </filter>
      </defs>
      <rect width="420" height="280" fill="url(#lgi-men-bg)" />
      <ellipse cx="80" cy="220" rx="90" ry="8" fill="#6ee7b7" opacity="0.2" />
      <circle cx="64" cy="64" r="30" fill="#4ade80" opacity="0.3" />
      <circle cx="358" cy="72" r="24" fill="#34d399" opacity="0.25" />

      {/* line chart + bubble */}
      <g filter="url(#lgi-men-soft)">
        <rect x="302" y="32" width="100" height="64" rx="10" fill="#fff" stroke="#10b981" strokeWidth="2" />
        <path d="M320 80 L340 64 L360 70 L380 50" stroke="#059669" strokeWidth="2" strokeLinecap="round" fill="none" />
        <rect x="314" y="50" width="4" height="4" fill="#10b981" />
        <rect x="330" y="50" width="4" height="4" fill="#10b981" />
        <rect x="350" y="50" width="4" height="4" fill="#10b981" />
      </g>
      <g>
        <rect x="8" y="40" width="80" height="40" rx="10" fill="#10b981" filter="url(#lgi-men-soft)" />
        <circle cx="20" cy="60" r="2.5" fill="#fff" />
        <circle cx="32" cy="60" r="2.5" fill="#fff" />
        <circle cx="44" cy="60" r="2.5" fill="#fff" />
        <path d="M32 80 L40 100 L50 80 Z" fill="#10b981" />
      </g>

      {/* potted plant */}
      <g filter="url(#lgi-men-soft)">
        <rect x="36" y="168" width="36" height="48" rx="2" fill="#0f3d1f" />
        <path d="M40 160c-8-4-2-20 6-20 0 0 2 0 0 0 0 0 8-8 2-2-6 8-2 2z" fill="#16a34a" />
        <path d="M50 150c-6-10-4-20 2-8 0 0 0 0 0 0 0 0 0 0-2-4z" fill="#22c55e" />
        <path d="M64 160c4-4 0-8-2-2-1 0-1 0-1 0 0 0-4-4-4-4" fill="#15803d" />
        <ellipse cx="54" cy="152" rx="3" ry="1" fill="#3f2e2e" transform="rotate(-5 54 152)" />
      </g>

      <g filter="url(#lgi-men-soft)">
        <rect x="220" y="200" width="200" height="16" rx="3" fill="#8b99b0" />
        <rect x="230" y="120" width="180" height="100" rx="6" fill="#5e6b82" />
        <rect x="240" y="128" width="160" height="70" rx="2" fill="#f8fafc" />
        <path d="M255 150h100M255 170h60" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <rect x="256" y="200" width="100" height="3" rx="1" fill="#3b4558" />
      </g>

      {/* mentor character */}
      <g>
        <ellipse cx="140" cy="64" rx="30" ry="32" fill="#0f172a" />
        <ellipse cx="140" cy="88" rx="28" ry="34" fill="#ffedd4" />
        <rect x="122" y="100" width="20" height="8" rx="2" fill="#d1fae5" />
        <circle cx="130" cy="86" r="2" fill="#0f172a" />
        <circle cx="150" cy="86" r="2" fill="#0f172a" />
        <path d="M132 100c2 0 4 0 6-1" stroke="#9a3412" strokeWidth="1" fill="none" strokeLinecap="round" />
        <rect x="100" y="110" width="80" height="32" rx="6" fill="url(#lgi-men-sweater)" />
        <rect x="100" y="128" width="80" height="100" rx="20" fill="url(#lgi-men-sweater)" />
        <path d="M100 120h80l-6-10H106z" fill="#d1fae5" />
        <rect x="100" y="200" width="80" height="3" rx="1" fill="#0f172a" opacity="0.08" />
      </g>
    </svg>
  );
}
