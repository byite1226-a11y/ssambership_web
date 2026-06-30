import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type MobileNavTabItem = {
  href: string;
  label: string;
  active: boolean;
  Icon?: LucideIcon;
};

/**
 * 모바일 전용 섹션 네비 — 가로 스크롤 탭 스트립.
 * 데스크탑(lg+)에선 숨김(`lg:hidden`); 데스크탑은 기존 좌측 사이드바를 그대로 사용.
 * 본문 위에 한 줄로 얹혀 콘텐츠를 밀어내지 않게 한다(섹션 네비 통일 패턴).
 */
export function MobileNavTabs(props: {
  items: MobileNavTabItem[];
  tone?: "blue" | "green";
  ariaLabel?: string;
  className?: string;
}) {
  const activeBg = props.tone === "green" ? "bg-[#059669]" : "bg-[#2563EB]";
  return (
    <nav
      aria-label={props.ariaLabel ?? "섹션 메뉴"}
      className={`lg:hidden flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${props.className ?? ""}`}
    >
      {props.items.map((it) => {
        const Icon = it.Icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={it.active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-bold transition ${
              it.active
                ? `border-transparent ${activeBg} text-white`
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
