/**
 * 로그인 전용: 학생 인물 + 노트북 + 질문 말풍선 (flat illustration)
 */
export function LoginStudentHeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="lgi-stu-bg" x1="0" y1="0" x2="420" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e0f2fe" />
          <stop offset="0.55" stopColor="#dbeafe" />
          <stop offset="1" stopColor="#bfdbfe" />
        </linearGradient>
        <linearGradient id="lgi-stu-hood" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id="lgi-stu-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.08" />
        </filter>
      </defs>
      <rect width="420" height="280" fill="url(#lgi-stu-bg)" />
      <ellipse cx="72" cy="220" rx="90" ry="8" fill="#b8d4ff" opacity="0.35" />
      <circle cx="58" cy="64" r="30" fill="#7cb6ff" opacity="0.3" />
      <circle cx="360" cy="70" r="22" fill="#5fa4ff" opacity="0.25" />

      <g filter="url(#lgi-stu-soft)">
        <rect x="28" y="198" width="22" height="52" rx="3" fill="#f8fafc" stroke="#e2a042" strokeWidth="2" />
        <rect x="52" y="188" width="20" height="62" rx="3" fill="#fff" stroke="#f59e0b" strokeWidth="2" />
        <rect x="75" y="198" width="22" height="52" rx="3" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="2" />
      </g>

      <g filter="url(#lgi-stu-soft)">
        <rect x="12" y="36" width="96" height="60" rx="14" fill="#1d4ed8" />
        <path d="M44 98 L52 118 L66 100 Z" fill="#1d4ed8" />
        <text
          x="60"
          y="80"
          textAnchor="middle"
          fill="#fff"
          style={{ fontSize: 32, fontWeight: 800, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          ?
        </text>
      </g>

      <g filter="url(#lgi-stu-soft)">
        <rect x="224" y="200" width="192" height="16" rx="3" fill="#8b99b0" />
        <rect x="232" y="118" width="176" height="98" rx="6" fill="#5e6b82" />
        <rect x="240" y="128" width="160" height="70" rx="2" fill="#f8fafc" />
        <path d="M250 150h100M250 168h80" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <rect x="258" y="200" width="100" height="3" rx="1" fill="#3b4558" />
      </g>

      <g>
        <path
          d="M100 80c0-32 24-50 50-50s50 16 50 50c0 20-6 32-10 40v0h-80v0c-4-8-10-20-10-40z"
          fill="#1a0d05"
        />
        <path
          d="M110 86c-12 2-20 16-16 32 1 4 4 8 6 10"
          stroke="#1a0d05"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M190 86c12 2 20 16 16 32-1 4-4 8-6 10"
          stroke="#1a0d05"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="150" cy="90" rx="32" ry="40" fill="#ffedd4" />
        <circle cx="135" cy="90" r="2.2" fill="#0f172a" />
        <circle cx="165" cy="90" r="2.2" fill="#0f172a" />
        <path
          d="M152 102c-2 2-4 0-3-1"
          stroke="#b45309"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="122" y="100" width="20" height="10" rx="2" fill="#ffedd4" />
        <path
          d="M100 120c-2-2 2-6 10-4 20 4 40 4 60 0 8-2 12 2 10 8v4h-88l-2-2z"
          fill="url(#lgi-stu-hood)"
        />
        <rect x="106" y="128" width="88" height="100" rx="20" fill="url(#lgi-stu-hood)" />
        <rect x="116" y="200" width="70" height="4" rx="1" fill="#0f172a" opacity="0.1" />
      </g>
    </svg>
  );
}
