import Link from "next/link";

export type CommunityHeroCta = { href: string; label: string; tone?: "blue" | "green" | "slate" };

const toneClass: Record<NonNullable<CommunityHeroCta["tone"]>, string> = {
  blue: "bg-blue-600 text-white hover:bg-blue-700",
  green: "bg-emerald-600 text-white hover:bg-emerald-700",
  slate: "bg-slate-100 text-slate-800 hover:bg-slate-200",
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  ctas: CommunityHeroCta[];
};

export function CommunityPageHero(props: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{props.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{props.title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{props.description}</p>
      {props.ctas.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {props.ctas.map((cta) => (
            <Link
              key={cta.href + cta.label}
              href={cta.href}
              className={`rounded-lg px-3.5 py-2 text-sm font-bold shadow-sm transition ${toneClass[cta.tone ?? "blue"]}`}
            >
              {cta.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
