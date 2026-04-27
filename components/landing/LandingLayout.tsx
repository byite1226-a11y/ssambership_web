import type { ReactNode } from "react";
import type { UserRow } from "@/lib/types/user";
import type { User } from "@supabase/supabase-js";
import { LandingTopNav } from "@/components/landing/LandingTopNav";

export function LandingLayout(props: { user: User | null; profile: UserRow | null; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingTopNav user={props.user} profile={props.profile} />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">{props.children}</main>
    </div>
  );
}
