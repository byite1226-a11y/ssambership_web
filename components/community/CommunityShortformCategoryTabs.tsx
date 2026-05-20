"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SHORTFORM_CATEGORIES } from "@/lib/community/communityShortformConstants";

const PRIMARY = "#1A56DB";

export function CommunityShortformCategoryTabs(props: { active: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <nav className="flex flex-wrap gap-2" aria-label={"\uCE74\uD14C\uACE0\uB9AC"}>
      {SHORTFORM_CATEGORIES.map((c) => {
        const active = props.active === c.slug;
        const q = new URLSearchParams(sp.toString());
        if (c.slug === "all") q.delete("category");
        else q.set("category", c.slug);
        const href = q.toString() ? `${pathname}?${q}` : pathname;
        return (
          <Link
            key={c.slug}
            href={href}
            className={[
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
              active ? "text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
            style={active ? { backgroundColor: PRIMARY } : undefined}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}
