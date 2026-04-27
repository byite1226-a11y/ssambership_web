import Link from "next/link";
import type { AppRole } from "@/lib/types/user";
import { markNotificationReadFormAction } from "@/lib/notifications/notificationReadActions";
import { resolveNotificationHref, typeBadgeLabel } from "@/lib/notifications/notificationDeepLink";
import {
  formatNotificationTime,
  notificationTimeIso,
  notificationTitleLine,
  typeRaw,
} from "@/lib/notifications/notificationRowDisplay";
import { isNotificationReadRow, type NotificationHubLoad } from "@/lib/notifications/notificationsHubQueries";

type Row = Record<string, unknown>;

export function NotificationItemCard(props: {
  row: Row;
  hub: Pick<NotificationHubLoad, "readColumn" | "typeColumn">;
  role: AppRole;
}) {
  const { row, hub, role } = props;
  const read = isNotificationReadRow(row, hub.readColumn);
  const typeK = typeRaw(row, hub.typeColumn);
  const badge = typeBadgeLabel(typeK);
  const href = resolveNotificationHref(row, role, typeK);
  const tiso = notificationTimeIso(row);
  const title = notificationTitleLine(row);

  return (
    <article
      className={`rounded-2xl border p-3 text-sm ${
        read ? "border-slate-200 bg-slate-50/80" : "border-blue-200 bg-white shadow-sm"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full border px-2 py-0.5 font-bold ${
            badge.variant === "emerald"
              ? "border-emerald-300 text-emerald-900"
              : badge.variant === "blue"
                ? "border-blue-200 text-blue-900"
                : badge.variant === "violet"
                  ? "border-violet-200 text-violet-900"
                  : badge.variant === "amber"
                    ? "border-amber-200 text-amber-900"
                    : badge.variant === "red"
                      ? "border-red-200 text-red-900"
                      : "border-slate-200 text-slate-800"
          }`}
        >
          {badge.label}
        </span>
        {typeK && typeK !== badge.label && (
          <code className="text-[10px] text-slate-500" title="원본 type·kind">
            {typeK.length > 40 ? `${typeK.slice(0, 40)}…` : typeK}
          </code>
        )}
        <span className="ml-auto text-slate-500">{formatNotificationTime(tiso)}</span>
      </div>
      <h3 className="mt-1 font-extrabold text-slate-900">{title}</h3>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>{read ? "읽음" : "읽지 않음"}</span>
        <div className="flex items-center gap-2">
          {hub.readColumn && !read ? (
            <form action={markNotificationReadFormAction} className="inline">
              <input type="hidden" name="notificationId" value={String(row.id ?? "")} />
              <button
                type="submit"
                className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-900 hover:bg-blue-100"
                title="본인 알림만 읽음 처리"
              >
                읽음 처리
              </button>
            </form>
          ) : null}
          {hub.readColumn && read ? <span className="text-[10px] font-bold text-slate-500">처리됨</span> : null}
          {!hub.readColumn ? (
            <span className="text-[10px] font-bold text-amber-800" title="스키마에 읽음 컬럼 없음">
              읽음 컬럼 없음
            </span>
          ) : null}
          <Link className="font-bold text-blue-800 underline" href={href} prefetch={false}>
            열기 →
          </Link>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-slate-400">딥링크: {href}</p>
    </article>
  );
}
