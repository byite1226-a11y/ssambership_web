/**
 * 로그인 학생 카드 일러스트: 노트북 + 책 + 파란 ? 말풍선 (사람 제외)
 * 배경 투명, 카드 배경색과 자연스럽게 통합됨
 */
export function LoginStudentHeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Decorative plus signs */}
      <text x="12" y="38" fill="#9ab8e8" fontSize="18" fontWeight="700" fontFamily="system-ui">+</text>
      <text x="248" y="30" fill="#9ab8e8" fontSize="14" fontWeight="700" fontFamily="system-ui">+</text>
      <circle cx="265" cy="180" r="4" fill="#9ab8e8" opacity="0.5" />

      {/* === Speech bubble: blue circle with white ? === */}
      <circle cx="60" cy="80" r="44" fill="#4a7fff" />
      <text
        x="60" y="97"
        textAnchor="middle"
        fill="white"
        fontSize="40"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
      >?</text>
      {/* Bubble tail */}
      <path d="M78 118 L86 138 L64 122 Z" fill="#4a7fff" />

      {/* === Books stack === */}
      <rect x="40" y="238" width="70" height="16" rx="3" fill="#e67e22" />
      <rect x="40" y="238" width="10" height="16" rx="2" fill="#d35400" />
      <rect x="43" y="222" width="68" height="17" rx="3" fill="#f0b429" />
      <rect x="43" y="222" width="9" height="17" rx="2" fill="#e67e22" />
      <rect x="43" y="204" width="68" height="18" rx="3" fill="#1abc9c" />
      <rect x="43" y="204" width="9" height="18" rx="2" fill="#16a085" />

      {/* === Laptop === */}
      {/* Base */}
      <rect x="90" y="252" width="170" height="12" rx="4" fill="#90a4ae" />
      <rect x="100" y="248" width="150" height="6" rx="3" fill="#b0bec5" />
      {/* Lid */}
      <rect x="104" y="150" width="142" height="98" rx="6" fill="#78909c" />
      {/* Screen */}
      <rect x="113" y="159" width="124" height="76" rx="3" fill="#eef2ff" />
      {/* Screen content */}
      <rect x="123" y="172" width="72" height="7" rx="3" fill="#c5ceff" />
      <rect x="123" y="187" width="98" height="6" rx="3" fill="#dde2ff" />
      <rect x="123" y="200" width="84" height="6" rx="3" fill="#dde2ff" />
      <rect x="123" y="213" width="64" height="6" rx="3" fill="#dde2ff" />
      <circle cx="175" cy="164" r="2.5" fill="#546e7a" />
    </svg>
  );
}
