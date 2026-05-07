import Link from "next/link";
import { LayoutDashboard, ListOrdered, BookOpen, MessageSquare } from "lucide-react";

export type MentorCustomRequestNavKey = "dashboard" | "posts" | "orders";

interface NavItem {
  href: string;
  label: string;
  key: string;
  Icon?: typeof LayoutDashboard;
  badgeKey?: string;
}

interface NavGroup {
  title: string;
  href?: string;
  key?: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: "업무 홈",
    items: [
      { href: "/mentor/custom-request/dashboard", label: "대시보드", key: "dashboard", Icon: LayoutDashboard },
    ]
  },
  {
    title: "제안 관리",
    items: [
      { href: "/mentor/custom-request/posts", label: "새 의뢰 목록", key: "posts", Icon: ListOrdered, badgeKey: "open" },
      { href: "/mentor/custom-request/posts?tab=applied", label: "제안한 의뢰", key: "posts-applied", Icon: ListOrdered, badgeKey: "applied" },
    ]
  },
  {
    title: "수락된 의뢰",
    href: "/mentor/custom-request/orders?tab=billing",
    key: "orders-all",
    items: [
      { href: "/mentor/custom-request/orders?tab=billing", label: "결제 대기", key: "orders-billing", badgeKey: "billing" },
      { href: "/mentor/custom-request/orders?tab=work", label: "진행 중", key: "orders-work", badgeKey: "work" },
      { href: "/mentor/custom-request/orders?tab=delivery", label: "납품 대기", key: "orders-delivery", badgeKey: "delivery" },
      { href: "/mentor/custom-request/orders?tab=revision", label: "수정 요청", key: "orders-revision", badgeKey: "revision" },
      { href: "/mentor/custom-request/orders?tab=done", label: "종료된 의뢰", key: "orders-done", badgeKey: "done" },
    ]
  }
];

function isMenuItemActive(itemKey: string, activePage: MentorCustomRequestNavKey, currentTab?: string): boolean {
  if (itemKey === "dashboard") {
    return activePage === "dashboard";
  }
  if (itemKey === "posts") {
    return activePage === "posts" && (!currentTab || currentTab === "open");
  }
  if (itemKey === "posts-applied") {
    return activePage === "posts" && currentTab === "applied";
  }
  if (itemKey === "orders-billing") {
    return activePage === "orders" && currentTab === "billing";
  }
  if (itemKey === "orders-work") {
    return activePage === "orders" && currentTab === "work";
  }
  if (itemKey === "orders-delivery") {
    return activePage === "orders" && currentTab === "delivery";
  }
  if (itemKey === "orders-revision") {
    return activePage === "orders" && currentTab === "revision";
  }
  if (itemKey === "orders-done") {
    return activePage === "orders" && currentTab === "done";
  }
  return false;
}

export function MentorCustomRequestSubNav(props: {
  active: MentorCustomRequestNavKey;
  tab?: string;
  counts?: Record<string, number>;
}) {
  const { active, tab, counts } = props;
  return (
    <div className="flex flex-col gap-5">
      {/* Sidebar Main Navigation Card */}
      <nav
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        aria-label="맞춤의뢰 하위 메뉴"
      >
        <h2 className="mb-4 px-1.5 text-[15px] font-black tracking-tight text-slate-900">
          맞춤의뢰 (멘토용)
        </h2>
        <div className="space-y-4">
          {GROUPS.map((g) => {
            const isOrdersGroup = g.title === "수락된 의뢰";
            const ordersTotal = isOrdersGroup && counts
              ? (counts.billing ?? 0) + (counts.work ?? 0) + (counts.delivery ?? 0) + (counts.revision ?? 0) + (counts.done ?? 0)
              : 0;

            const isAnyChildActive = isOrdersGroup && active === "orders";

            return (
              <div key={g.title} className="space-y-1.5">
                {isOrdersGroup ? (
                  <Link
                    href={g.href ?? ""}
                    className={[
                      "flex min-h-[38px] items-center gap-2 px-1.5 py-1 text-xs font-black uppercase tracking-wide transition rounded-lg",
                      isAnyChildActive
                        ? "text-blue-700 bg-blue-50/40"
                        : "text-slate-400 hover:text-slate-700"
                    ].join(" ")}
                  >
                    <span>{g.title}</span>
                    {ordersTotal > 0 ? (
                      <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-100 px-1 text-[9px] font-black text-blue-600">
                        {ordersTotal}
                      </span>
                    ) : null}
                  </Link>
                 ) : (
                  <div className="px-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {g.title}
                  </div>
                )}

                <ul className={[
                  "space-y-1",
                  isOrdersGroup
                    ? `relative ml-3.5 pl-3 border-l ${isAnyChildActive ? "border-blue-200" : "border-slate-100"}`
                    : ""
                ].join(" ")}>
                  {g.items.map((item) => {
                    const isActive = isMenuItemActive(item.key, active, tab);
                    const count = item.badgeKey && counts ? counts[item.badgeKey] : undefined;

                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          className={[
                            "flex min-h-[36px] items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition",
                            isActive
                              ? "bg-blue-50 text-blue-600 shadow-[0_1px_2px_rgba(30,58,138,0.02)]"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          ].join(" ")}
                        >
                          {/* Child dot icon instead of big parent icon */}
                          {isOrdersGroup ? (
                            <span
                              className={[
                                "h-1.5 w-1.5 rounded-full shrink-0 transition-all",
                                isActive ? "bg-blue-600 scale-125 ring-2 ring-blue-100" : "bg-slate-300 hover:bg-slate-400"
                              ].join(" ")}
                            />
                          ) : (
                            <span
                              className={[
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border [&>svg]:h-3.5 [&>svg]:w-3.5",
                                isActive
                                  ? "border-blue-200 bg-blue-100/40 text-blue-600"
                                  : "border-slate-100 bg-slate-50 text-slate-400",
                              ].join(" ")}
                            >
                              {item.Icon && <item.Icon />}
                            </span>
                          )}

                          <span className="min-w-0 leading-snug truncate">{item.label}</span>
                          {count !== undefined && count > 0 ? (
                            <span className="ml-auto flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-blue-100/70 px-1 text-[9px] font-black text-blue-700">
                              {count}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mentor Guide Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">멘토 가이드</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          맞춤의뢰 진행 방법과 유의사항을 확인해보세요.
        </p>
        <Link
          href="#"
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <BookOpen className="h-3.5 w-3.5 text-slate-500" />
          가이드 보기
        </Link>
      </div>

      {/* Support Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">도움이 필요하신가요?</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          궁금한 점은 언제든 문의해주세요.
        </p>
        <Link
          href="#"
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
          문의하기
        </Link>
      </div>
    </div>
  );
}
