import type { MentorPayoutsPageData } from "@/lib/mentor/mentorPayoutsTypes";
import { MentorPayoutsHeroCard } from "./MentorPayoutsHeroCard";
import { MentorPayoutsMain } from "./MentorPayoutsMain";
import { MentorPayoutAccountPanel } from "./MentorPayoutAccountPanel";
import { MentorPayoutsRightPanel } from "./MentorPayoutsRightPanel";

export function MentorPayoutsPage(props: { data: MentorPayoutsPageData }) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">멘토 정산</h1>
        <p className="mt-1 text-sm text-slate-600">예상 정산 금액과 서비스 수익을 확인하세요.</p>
      </header>
      <div className="grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-[18px]">
          <MentorPayoutsHeroCard
            summary={props.data.summary}
            schedule={props.data.schedule}
            lifetimePaid={props.data.kpis.lifetimePaid}
          />
          <MentorPayoutAccountPanel
            bankName={props.data.summary.bankName}
            accountNumber={props.data.summary.bankAccountNumber}
            editable={props.data.summary.bankEditable}
          />
          <MentorPayoutsMain data={props.data} hideHero />
        </div>
        <MentorPayoutsRightPanel schedule={props.data.schedule} months={props.data.months} />
      </div>
    </div>
  );
}
