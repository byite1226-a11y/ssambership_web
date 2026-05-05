import { LandingTopNav } from "@/components/landing/LandingTopNav";
import { NoticeBanner } from "@/components/landing/NoticeBanner";
import type { User } from "@supabase/supabase-js";
import type { UserRow } from "@/lib/types/user";
import type { ReactNode } from "react";

export function LandingLayout(props: { user: User | null; profile: UserRow | null; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NoticeBanner />
      <LandingTopNav user={props.user} profile={props.profile} />
      <main className="mx-auto w-full max-w-[1280px] px-6">{props.children}</main>
    </div>
  );
}
