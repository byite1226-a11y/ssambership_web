import type { ReactNode } from "react";
import { MentorCustomRequestSubNav, type MentorCustomRequestNavKey } from "@/components/customRequest/MentorCustomRequestSubNav";

export function MentorCustomRequestWorkspaceLayout(props: {
  active: MentorCustomRequestNavKey;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="w-full shrink-0 lg:w-56 lg:pt-1">
        <MentorCustomRequestSubNav active={props.active} />
      </aside>
      <div className="min-w-0 flex-1">{props.children}</div>
    </div>
  );
}
