export function RoleStudentCardIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="role-student-bg" x1="0" y1="0" x2="520" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#dbeafe" />
          <stop offset="1" stopColor="#eff6ff" />
        </linearGradient>
      </defs>
      <rect width="520" height="300" rx="36" fill="url(#role-student-bg)" />
      <circle cx="430" cy="60" r="34" fill="#bfdbfe" />
      <circle cx="84" cy="74" r="24" fill="#93c5fd" opacity="0.7" />

      <rect x="294" y="102" width="182" height="126" rx="14" fill="#38bdf8" opacity="0.95" />
      <rect x="306" y="114" width="158" height="88" rx="8" fill="#f8fafc" />
      <path d="M324 138h84M324 158h112M324 178h66" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

      <circle cx="182" cy="94" r="36" fill="#0f172a" />
      <circle cx="184" cy="98" r="29" fill="#fde68a" />
      <path d="M154 98c6-22 15-32 30-32 18 0 31 14 35 32-8-6-20-10-33-10-13 0-24 4-32 10z" fill="#1e3a8a" />
      <circle cx="174" cy="99" r="2.7" fill="#0f172a" />
      <circle cx="194" cy="99" r="2.7" fill="#0f172a" />
      <path d="M176 112c4 4 11 4 15 0" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="126" y="150" width="128" height="114" rx="20" fill="#0ea5e9" />
      <rect x="146" y="166" width="86" height="66" rx="8" fill="#e0f2fe" />
      <path d="M159 188h58M159 205h38" stroke="#0369a1" strokeWidth="4" strokeLinecap="round" />

      <path d="M132 146l-30 16 18 22 32-20" fill="#0284c7" />
      <path d="M98 160l-16-16" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" />
      <circle cx="75" cy="132" r="22" fill="#fbbf24" />
      <path d="M75 123c-7 0-10 4-8 8 2 2 3 3 3 6M74 145v2" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />

      <rect x="276" y="230" width="210" height="8" rx="4" fill="#93c5fd" />
      <rect x="36" y="230" width="204" height="8" rx="4" fill="#93c5fd" />
    </svg>
  );
}
