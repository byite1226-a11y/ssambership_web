import Link from "next/link";
import { LayoutDashboard, ListOrdered, ClipboardList } from "lucide-react";

export type MentorCustomRequestNavKey = "dashboard" | "posts" | "orders";

const ITEMS: { href: string; label: string; key: MentorCustomRequestNavKey; Icon: typeof LayoutDashboard }[] = [
  { href: "/mentor/custom-request/dashboard", label: "맞춤의뢰 대시보드", key: "dashboard", Icon: LayoutDashboard },
  { href: "/mentor/custom-request/posts", label: "새 의뢰 목록", key: "posts", Icon: ListOrdered },
  { href: "/mentor/custom-request/orders", label: "맞춤의뢰 주문", key: "orders", Icon: ClipboardList },
];

export function MentorCustomRequestSubNav(props: { active: MentorCustomRequestNavKey }) {
  const active = props.active;
  return (
    <nav
      className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
      aria-label="맞춤의뢰 하위 메뉴"
    >
      <ul className="space-y-1">
        {ITEMS.map(({ href, label, key, Icon }) => {
          const isActive = active === key;
          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border [&>svg]:h-4 [&>svg]:w-4",
                    isActive ? "border-white/30 bg-white/15 text-white" : "border-slate-200 bg-slate-50 text-slate-600",
                  ].join(" ")}
                  aria-hidden
                >
                  <Icon />
                </span>
                <span className="min-w-0 leading-snug">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
