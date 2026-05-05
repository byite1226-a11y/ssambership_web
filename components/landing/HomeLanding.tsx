"use client";

import type { HomeLandingData } from "@/lib/landing/landingPageQueries";
import type { UserRow } from "@/lib/types/user";
import type { User } from "@supabase/supabase-js";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingCTASection } from "@/components/landing/LandingCTASection";
import { RecommendedMentorsSection } from "@/components/landing/RecommendedMentorsSection";
import { TrustMetricsSection } from "@/components/landing/TrustMetricsSection";
import { FeatureAndNoticeSection } from "@/components/landing/FeatureAndNoticeSection";
import { DashboardStatsSection } from "@/components/landing/DashboardStatsSection";
import { DashboardActivitySection } from "@/components/landing/DashboardActivitySection";

export function HomeLanding(props: { 
  data: HomeLandingData; 
  user: User | null; 
  profile: UserRow | null;
}) {
  const logged = Boolean(props.user);
  const d = props.data;

  return (
    <div className="pb-20">
      <HeroSection loggedIn={logged} />
      
      {logged ? (
        <>
          <DashboardStatsSection profile={props.profile} />
          <RecommendedMentorsSection data={d.mentors} />
          <DashboardActivitySection />
        </>
      ) : (
        <>
          <TrustMetricsSection metrics={d.trust} />
          <FeatureAndNoticeSection notices={d.notices} />
          <RecommendedMentorsSection data={d.mentors} />
          <LandingCTASection />
        </>
      )}

      {/* Simplified Footer for Landing */}
      <footer className="mt-16 border-t border-slate-100 pt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
             <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M3 10 12 4l9 6-9 6-9-6Zm2.5 2.8L12 17l6.5-4.2V16L12 20l-6.5-4v-3.2Z" />
                </svg>
              </div>
              <span className="text-[16px] font-black tracking-tight text-slate-800 uppercase">ssambership</span>
          </div>
          <div className="flex items-center gap-8 text-[13px] font-bold text-slate-400">
            <Link href="/terms" className="hover:text-slate-600 transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">개인정보처리방침</Link>
            <Link href="/cs" className="hover:text-slate-600 transition-colors">고객센터</Link>
          </div>
          <p className="text-[12px] font-medium text-slate-300">
            © SSAMBESHIP. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Internal Link component for footer
function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>{children}</a>
  );
}
