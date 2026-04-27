export function RoleMentorCardIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="role-mentor-bg" x1="0" y1="0" x2="520" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d1fae5" />
          <stop offset="1" stopColor="#ecfdf5" />
        </linearGradient>
      </defs>
      <rect width="520" height="300" rx="36" fill="url(#role-mentor-bg)" />
      <circle cx="78" cy="60" r="26" fill="#86efac" />
      <circle cx="434" cy="78" r="36" fill="#a7f3d0" />

      <g>
        <path d="M66 220h24v-88H66c-6 0-10 4-10 10v66c0 5 5 10 10 10z" fill="#166534" />
        <ellipse cx="58" cy="146" rx="22" ry="8" fill="#4ade80" />
        <ellipse cx="68" cy="128" rx="18" ry="6" fill="#22c55e" />
      </g>

      <circle cx="302" cy="86" r="35" fill="#14532d" />
      <circle cx="302" cy="92" r="28" fill="#fde68a" />
      <path
        d="M272 86c6-20 16-30 30-30 18 0 30 13 34 30-8-5-20-8-32-8-12 0-23 3-32 8z"
        fill="#064e3b"
      />
      <circle cx="292" cy="92" r="2.7" fill="#0f172a" />
      <circle cx="312" cy="92" r="2.7" fill="#0f172a" />
      <path d="M294 105c4 4 10 4 14 0" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="242" y="136" width="122" height="124" rx="22" fill="#10b981" />
      <path d="M286 148h32l18 22h-68l18-22z" fill="#d1fae5" />
      <rect x="280" y="168" width="44" height="52" rx="8" fill="#ecfdf5" />

      <rect x="98" y="114" width="128" height="96" rx="12" fill="#34d399" />
      <rect x="110" y="126" width="104" height="70" rx="8" fill="#f8fafc" />
      <path d="M122 146h64M122 162h80M122 178h44" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

      <rect x="350" y="28" width="132" height="56" rx="12" fill="#ffffff" stroke="#34d399" strokeWidth="3" />
      <path d="M374 58l12 12 30-30" stroke="#059669" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M352 236c20-8 40-24 56-42" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
      <path d="M408 194l14 4-4 14" stroke="#059669" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="34" y="236" width="210" height="8" rx="4" fill="#86efac" />
      <rect x="280" y="236" width="204" height="8" rx="4" fill="#86efac" />
    </svg>
  );
}
