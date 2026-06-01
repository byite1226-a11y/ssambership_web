import Link from "next/link";
import { SURFACE_CARD } from "@/lib/ui/surfaceCard";

export type CommunityHeroCta = { href: string; label: string; tone?: "blue" | "green" | "slate" };

const toneClass: Record<NonNullable<CommunityHeroCta["tone"]>, string> = {
  blue: "bg-blue-600 text-white hover:bg-blue-700",
  green: "bg-emerald-600 text-white hover:bg-emerald-700",
  slate: "bg-slate-100 text-slate-800 hover:bg-slate-200",
};

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  /** 좌측 네비와 중복되지 않도록 화면별로 0~1개만 전달 */
  primaryAction?: CommunityHeroCta | null;
  secondaryAction?: CommunityHeroCta | null;
};

export function CommunityPageHero(props: Props) {
  const cta = props.primaryAction;
  const secondary = props.secondaryAction;
  return (
    <section className={SURFACE_CARD}>
      {props.eyebrow ? (
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{props.eyebrow}</p>
      ) : null}
      <h1 className={`text-[22px] font-bold tracking-tight text-slate-900 ${props.eyebrow ? "mt-2" : ""}`}>
        {props.title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{props.description}</p>
      {cta || secondary ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {cta ? (
            <Link
              href={cta.href}
              className={`inline-flex rounded-lg px-3.5 py-2 text-sm font-bold shadow-sm transition ${toneClass[cta.tone ?? "blue"]}`}
            >
              {cta.label}
            </Link>
          ) : null}
          {secondary ? (
            <Link
              href={secondary.href}
              className={`inline-flex rounded-lg px-3.5 py-2 text-sm font-bold shadow-sm transition ${toneClass[secondary.tone ?? "slate"]}`}
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
