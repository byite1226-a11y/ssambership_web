import { LandingTopNav } from "@/components/landing/LandingTopNav";
import { NoticeBanner } from "@/components/landing/NoticeBanner";
import type { User } from "@supabase/supabase-js";
import type { UserRow } from "@/lib/types/user";
import type { ReactNode } from "react";

export function LandingLayout(props: { user: User | null; profile: UserRow | null; children: ReactNode }) {
  return (
    <div className="min-h-screen max-w-full bg-white text-slate-900 scheme-light">
      <NoticeBanner />
      <LandingTopNav user={props.user} profile={props.profile} />
      {/* overflow-x only under header so sticky TopNav is not inside an overflow-x clip ancestor */}
      <main className="mx-auto w-full min-w-0 max-w-[1280px] overflow-x-hidden px-4 sm:px-6">{props.children}</main>
    </div>
  );
}
