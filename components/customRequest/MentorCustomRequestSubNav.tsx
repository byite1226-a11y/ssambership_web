import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Send,
  CheckCircle,
  PlayCircle,
  Package,
  XCircle,
  ClipboardList,
  Star,
  BookOpen,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

export type MentorCustomRequestNavKey = "dashboard" | "posts" | "orders";

interface NavItem {
  href: string;
  label: string;
  key: string;
  Icon: React.ElementType;
  badgeKey?: string;
}

interface MentorCustomRequestSubNavProps {
  active: MentorCustomRequestNavKey;
  tab?: string;
  counts?: Record<string, number>;
}

function isItemActive(itemKey: string, active: MentorCustomRequestNavKey, tab?: string): boolean {
  if (itemKey === "dashboard") return active === "dashboard";
  if (itemKey === "posts-open") return active === "posts" && (!tab || tab === "open");
  if (itemKey === "posts-applied") return active === "posts" && tab === "applied";
  // '수락된 의뢰' is active when on orders page (any tab or no tab)
  if (itemKey === "orders-all") return active === "orders";
  if (itemKey === "orders-work") return active === "orders" && (tab === "work" || tab === "revision");
  if (itemKey === "orders-delivery") return active === "orders" && tab === "delivery";
  if (itemKey === "orders-done") return active === "orders" && tab === "done";
  return false;
}

export function MentorCustomRequestSubNav(props: MentorCustomRequestSubNavProps) {
  const { active, tab, counts = {} } = props;

  const navItems: NavItem[] = [
    {
      href: "/mentor/custom-request/dashboard",
      label: "대시보드",
      key: "dashboard",
      Icon: LayoutDashboard,
    },
    {
      href: "/mentor/custom-request/posts",
      label: "새 의뢰 목록",
      key: "posts-open",
      Icon: FileText,
      badgeKey: "open",
    },
    {
      href: "/mentor/custom-request/posts?tab=applied",
      label: "제안한 의뢰",
      key: "posts-applied",
      Icon: Send,
      badgeKey: "applied",
    },
    {
      // links to orders page - shows total accepted (non-done) orders count
      href: "/mentor/custom-request/orders",
      label: "수락된 의뢰",
      key: "orders-all",
      Icon: CheckCircle,
      badgeKey: "ordersTotal",
    },
    {
      href: "/mentor/custom-request/orders?tab=work",
      label: "진행 중",
      key: "orders-work",
      Icon: PlayCircle,
      badgeKey: "work",
    },
    {
      href: "/mentor/custom-request/orders?tab=delivery",
      label: "납품 완료",
      key: "orders-delivery",
      Icon: Package,
      badgeKey: "delivery",
    },
    {
      href: "/mentor/custom-request/orders?tab=done",
      label: "종료된 의뢰",
      key: "orders-done",
      Icon: XCircle,
      badgeKey: "done",
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      href: "/mentor/custom-request/posts?tab=applied",
      label: "제안 내역",
      key: "applied-history",
      Icon: ClipboardList,
    },
    {
      href: "/mentor/custom-request/posts",
      label: "즐겨찾기 의뢰",
      key: "bookmarks",
      Icon: Star,
    },
    {
      href: "#",
      label: "의뢰 가이드",
      key: "guide",
      Icon: BookOpen,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Nav */}
      <nav
        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        aria-label="맞춤의뢰 하위 메뉴"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-[13px] font-black tracking-tight text-slate-800">
            맞춤의뢰 (멘토용)
          </h2>
        </div>

        {/* Nav Items */}
        <ul className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = isItemActive(item.key, active, tab);
            const count = item.badgeKey ? counts[item.badgeKey] : undefined;
            const showBadge = count !== undefined && count > 0;

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={[
                    "flex min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all duration-150",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  <item.Icon
                    className={["h-4 w-4 shrink-0", isActive ? "text-white/90" : "text-slate-400"].join(" ")}
                  />
                  <span className="flex-1 leading-tight">{item.label}</span>
                  {showBadge && (
                    <span
                      className={[
                        "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-black",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-blue-100 text-blue-700",
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}

          {/* Divider */}
          <li className="my-1.5 border-t border-slate-100" />

          {bottomNavItems.map((item) => {
            const isActive = isItemActive(item.key, active, tab);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={[
                    "flex min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all duration-150",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  <item.Icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 leading-tight">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mentor Guide Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <h3 className="text-[13px] font-black text-slate-900">멘토 가이드</h3>
        </div>
        <p className="text-[12px] leading-relaxed text-slate-500 mb-3">
          맞춤의뢰 진행 방법과<br />유의사항을 확인해보세요.
        </p>
        <Link
          href="/legal/no-ghostwriting"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
          운영 정책 안내
        </Link>
      </div>

      {/* Help Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-4 w-4 text-slate-500" />
          <h3 className="text-[13px] font-black text-slate-900">도움이 필요하신가요?</h3>
        </div>
        <p className="text-[12px] leading-relaxed text-slate-500 mb-3">
          궁금한 점은 언제든 문의해주세요.
        </p>
        <Link
          href="/notifications"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
          알림 센터
        </Link>
      </div>
    </div>
  );
}
