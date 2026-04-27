export function StudentAuthIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="ssam-student-bg-v2" x1="0" y1="0" x2="520" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#dbeafe" />
          <stop offset="1" stopColor="#eff6ff" />
        </linearGradient>
        <linearGradient id="ssam-student-laptop-v2" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect width="520" height="280" rx="36" fill="url(#ssam-student-bg-v2)" />
      <circle cx="452" cy="54" r="34" fill="#bfdbfe" />
      <circle cx="74" cy="70" r="20" fill="#93c5fd" opacity="0.75" />

      <rect x="304" y="106" width="184" height="130" rx="15" fill="url(#ssam-student-laptop-v2)" />
      <rect x="318" y="120" width="156" height="90" rx="9" fill="#f8fafc" />
      <path d="M336 148h84M336 168h112M336 186h56" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

      <circle cx="190" cy="92" r="36" fill="#1e3a8a" />
      <ellipse cx="188" cy="102" rx="28" ry="30" fill="#fde68a" />
      <path d="M157 93c4-22 17-34 33-34 18 0 31 14 34 34-8-5-20-9-33-9s-25 4-34 9z" fill="#1e3a8a" />
      <circle cx="177" cy="102" r="3" fill="#0f172a" />
      <circle cx="201" cy="102" r="3" fill="#0f172a" />
      <path d="M181 116c6 5 14 5 20 0" stroke="#b45309" strokeWidth="2.4" strokeLinecap="round" />

      <rect x="130" y="144" width="128" height="120" rx="24" fill="#0ea5e9" />
      <rect x="140" y="188" width="108" height="72" rx="8" fill="#e0f2fe" />
      <path d="M158 210h62M158 226h36" stroke="#0369a1" strokeWidth="4" strokeLinecap="round" />

      <path d="M132 152l-26 16 16 24 30-20" fill="#0284c7" />
      <path d="M108 166l-18-16" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" />

      <rect x="54" y="122" width="56" height="56" rx="16" fill="#fff" stroke="#f59e0b" strokeWidth="3" />
      <g stroke="#d97706" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" fill="none">
        <path d="M84 140c-8 0-11 5-9 9 2 3 3 4 3 7" />
        <path d="M84 162v2" />
      </g>

      <rect x="302" y="240" width="186" height="8" rx="4" fill="#93c5fd" />
      <rect x="44" y="240" width="214" height="8" rx="4" fill="#93c5fd" />
    </svg>
  );
}
