import type { ReactNode } from "react";
import { MentorCustomRequestSubNav, type MentorCustomRequestNavKey } from "@/components/customRequest/MentorCustomRequestSubNav";

export function MentorCustomRequestWorkspaceLayout(props: {
  active: MentorCustomRequestNavKey;
  tab?: string;
  counts?: Record<string, number>;
  showAuxCards?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      {/* Left sidebar - ~200px wide matching reference design */}
      <aside className="order-2 w-full shrink-0 lg:order-1 lg:w-[200px]">
        <div className="lg:sticky lg:top-20">
          <MentorCustomRequestSubNav
            active={props.active}
            tab={props.tab}
            counts={props.counts}
            showAuxCards={props.showAuxCards}
          />
        </div>
      </aside>
      {/* Main content */}
      <div className="order-1 min-w-0 flex-1 lg:order-2">{props.children}</div>
    </div>
  );
}
