export function MentorAuthIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="ssam-mentor-bg-v2" x1="0" y1="0" x2="520" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d1fae5" />
          <stop offset="1" stopColor="#ecfdf5" />
        </linearGradient>
        <linearGradient id="ssam-mentor-panel-v2" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="520" height="280" rx="36" fill="url(#ssam-mentor-bg-v2)" />
      <circle cx="70" cy="58" r="24" fill="#86efac" />
      <circle cx="448" cy="72" r="34" fill="#a7f3d0" />

      <g>
        <path d="M66 224h24v-92H66c-6 0-10 4-10 10v72c0 5 5 10 10 10z" fill="#166534" />
        <ellipse cx="58" cy="146" rx="21" ry="8" fill="#4ade80" />
        <ellipse cx="68" cy="128" rx="17" ry="6" fill="#22c55e" />
      </g>

      <circle cx="296" cy="86" r="35" fill="#14532d" />
      <ellipse cx="296" cy="94" rx="28" ry="29" fill="#fde68a" />
      <path d="M266 86c4-20 16-31 30-31 18 0 29 13 33 31-8-5-19-8-31-8-13 0-24 3-32 8z" fill="#064e3b" />
      <circle cx="286" cy="94" r="3" fill="#0f172a" />
      <circle cx="308" cy="94" r="3" fill="#0f172a" />
      <path d="M289 108c5 4 12 4 17 0" stroke="#92400e" strokeWidth="2.4" strokeLinecap="round" />

      <rect x="236" y="136" width="124" height="126" rx="24" fill="#10b981" />
      <path d="M280 148h34l16 22h-66l16-22z" fill="#d1fae5" />
      <rect x="276" y="172" width="44" height="56" rx="8" fill="#ecfdf5" />

      <rect x="96" y="114" width="132" height="98" rx="12" fill="url(#ssam-mentor-panel-v2)" />
      <rect x="110" y="126" width="104" height="72" rx="8" fill="#f8fafc" />
      <path d="M122 148h64M122 166h82M122 182h44" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
      <g>
        <rect x="348" y="28" width="132" height="56" rx="12" fill="#fff" stroke="#34d399" strokeWidth="3" />
        <path d="M372 58l12 12 30-30" stroke="#059669" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <path d="M350 236c20-8 40-24 56-42" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
      <path d="M406 194l14 4-4 14" stroke="#059669" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="36" y="236" width="194" height="8" rx="4" fill="#86efac" />
      <rect x="280" y="236" width="204" height="8" rx="4" fill="#86efac" />
    </svg>
  );
}
