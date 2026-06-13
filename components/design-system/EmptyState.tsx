import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type DsEmptyStateProps = {
  title: string;
  description?: string;
  /** lucide 아이콘 — 기본 Inbox */
  icon?: LucideIcon;
  /** CTA 버튼 등 — Button 컴포넌트로 감싸서 전달 */
  action?: ReactNode;
  className?: string;
};

/**
 * 데이터 없음 — 큰 빈 카드 대신 짧고 우아한 안내.
 * "0/—/준비 중"을 크게 노출하지 않음.
 */
export function EmptyState(props: DsEmptyStateProps) {
  const { title, description, icon: Icon = Inbox, action, className } = props;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ds-border-subtle bg-ds-muted/50 px-6 py-10 text-center",
        className,
      )}
    >
      <Icon className="h-10 w-10 text-ds-tertiary" strokeWidth={1.5} aria-hidden />
      <p className="mt-4 ds-text-h3">{title}</p>
      {description ? <p className="mt-2 max-w-sm ds-text-body">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
