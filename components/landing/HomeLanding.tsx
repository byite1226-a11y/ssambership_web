import type { HomeLandingData } from "@/lib/landing/landingPageQueries";
import { LANDING_DATA_MODEL } from "@/lib/landing/landingDataModel";
import { CommunityPreviewSection } from "@/components/landing/CommunityPreviewSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingCTASection } from "@/components/landing/LandingCTASection";
import { NoticeBanner } from "@/components/landing/NoticeBanner";
import { PricingPreviewSection } from "@/components/landing/PricingPreviewSection";
import { QuestionRoomPreviewSection } from "@/components/landing/QuestionRoomPreviewSection";
import { RecommendedMentorsSection } from "@/components/landing/RecommendedMentorsSection";
import { TrustMetricsSection } from "@/components/landing/TrustMetricsSection";

export function HomeLanding(props: { data: HomeLandingData }) {
  const d = props.data;
  return (
    <div className="space-y-10">
      <NoticeBanner data={d.notices} />
      <HeroSection />
      <TrustMetricsSection metrics={d.trust} />
      <RecommendedMentorsSection list={d.mentors} />
      <QuestionRoomPreviewSection />
      <PricingPreviewSection plans={d.plans} byTier={d.pricingByTier} fillProbe={d.pricingFillProbe} />
      <CommunityPreviewSection shorts={d.shorts} boards={d.boards} />
      <LandingCTASection />
      <footer className="border-t border-slate-200 pt-6 text-xs text-slate-500">
        <p className="font-extrabold text-slate-700">서비스 구성 안내</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {LANDING_DATA_MODEL.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
