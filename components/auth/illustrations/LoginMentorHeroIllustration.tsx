/**
 * 로그인 멘토 카드 일러스트: 노트북 + 식물 + 초록 ··· 말풍선 + 차트 (사람 제외)
 * 배경 투명, 카드 배경색과 자연스럽게 통합됨
 */
export function LoginMentorHeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Decorative elements */}
      <text x="10" y="38" fill="#7ecba8" fontSize="18" fontWeight="700" fontFamily="system-ui">+</text>
      <text x="252" y="32" fill="#7ecba8" fontSize="14" fontWeight="700" fontFamily="system-ui">+</text>
      <circle cx="265" cy="190" r="4" fill="#7ecba8" opacity="0.5" />

      {/* === Chart card (top right) === */}
      <rect x="180" y="20" width="85" height="65" rx="8" fill="white" opacity="0.88" />
      <rect x="180" y="20" width="85" height="65" rx="8" stroke="#a8e8c8" strokeWidth="1.2" />
      {/* Chart bars */}
      <rect x="195" y="60" width="8" height="10" rx="1.5" fill="#2ecc71" opacity="0.7" />
      <rect x="210" y="50" width="8" height="20" rx="1.5" fill="#27ae60" />
      <rect x="225" y="42" width="8" height="28" rx="1.5" fill="#1e8449" />
      <rect x="240" y="52" width="8" height="18" rx="1.5" fill="#2ecc71" opacity="0.7" />
      {/* Trend line */}
      <path d="M195 62 L215 52 L228 44 L250 54" stroke="#16a085" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* === Speech bubble: green rounded rect with three dots === */}
      <rect x="30" y="60" width="100" height="54" rx="14" fill="#27ae60" />
      {/* Bubble tail */}
      <path d="M90 114 L84 134 L106 118 Z" fill="#27ae60" />
      {/* Three dots */}
      <circle cx="55" cy="87" r="7" fill="white" />
      <circle cx="80" cy="87" r="7" fill="white" />
      <circle cx="105" cy="87" r="7" fill="white" />

      {/* === Plant (lower left) === */}
      {/* Pot */}
      <path d="M30 262 L24 286 L60 286 L54 262 Z" fill="#c0392b" />
      <rect x="22" y="256" width="46" height="9" rx="2.5" fill="#e74c3c" />
      <ellipse cx="42" cy="260" rx="22" ry="5" fill="#795548" />
      {/* Leaves */}
      <path d="M42 260 C42 235 24 222 16 212 C31 218 42 236 42 260 Z" fill="#27ae60" />
      <path d="M42 260 C42 230 60 216 68 206 C54 216 42 232 42 260 Z" fill="#2ecc71" />
      <path d="M42 260 C42 244 34 232 26 226 C36 232 42 244 42 260 Z" fill="#1e8449" />

      {/* === Laptop === */}
      {/* Base */}
      <rect x="90" y="252" width="160" height="12" rx="4" fill="#90a4ae" />
      <rect x="100" y="248" width="140" height="6" rx="3" fill="#b0bec5" />
      {/* Lid */}
      <rect x="104" y="150" width="132" height="98" rx="6" fill="#78909c" />
      {/* Screen */}
      <rect x="113" y="159" width="114" height="76" rx="3" fill="#f0fff8" />
      {/* Screen lines */}
      <rect x="123" y="172" width="70" height="7" rx="3" fill="#b8dfc8" />
      <rect x="123" y="187" width="90" height="6" rx="3" fill="#cceedd" />
      <rect x="123" y="200" width="80" height="6" rx="3" fill="#cceedd" />
      <rect x="123" y="213" width="60" height="6" rx="3" fill="#cceedd" />
    </svg>
  );
}
