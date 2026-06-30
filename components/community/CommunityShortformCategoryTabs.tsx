"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { communityFilterChipClass } from "@/components/community/communityFilterChipStyles";
import { SHORTFORM_CATEGORIES } from "@/lib/community/communityShortformConstants";

export function CommunityShortformCategoryTabs(props: { active: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <>
      {/* \uBAA8\uBC14\uC77C: \uAC00\uB85C \uC2A4\uD06C\uB864 \uD55C \uC904(5\uCE69 \u2192 \uB9C8\uC9C0\uB9C9 \uCE69 peek) \u00B7 \uB370\uC2A4\uD06C\uD0D1(md+): \uAE30\uC874 flex-wrap \uADF8\uB300\uB85C */}
      <nav
        className="community-filter-scroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        aria-label={"\uCE74\uD14C\uACE0\uB9AC"}
      >
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
              className={`${communityFilterChipClass(active, "sm")} shrink-0 whitespace-nowrap`}
            >
              {c.label}
            </Link>
          );
        })}
      </nav>
      <style jsx global>{`
        .community-filter-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
