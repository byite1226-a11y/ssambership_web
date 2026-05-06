import type { ReactNode } from "react";
import { MentorCustomRequestSubNav, type MentorCustomRequestNavKey } from "@/components/customRequest/MentorCustomRequestSubNav";

export function MentorCustomRequestWorkspaceLayout(props: {
  active: MentorCustomRequestNavKey;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="order-2 w-full shrink-0 lg:order-1 lg:w-56 lg:pt-1">
        <MentorCustomRequestSubNav active={props.active} />
      </aside>
      <div className="order-1 min-w-0 flex-1 lg:order-2">{props.children}</div>
    </div>
  );
}
