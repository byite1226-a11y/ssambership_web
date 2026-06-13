"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { communityFilterChipClass } from "@/components/community/communityFilterChipStyles";
import { SHORTFORM_CATEGORIES } from "@/lib/community/communityShortformConstants";

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
            className={communityFilterChipClass(active, "sm")}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}
