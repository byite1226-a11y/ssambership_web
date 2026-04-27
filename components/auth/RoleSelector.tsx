import type { AppRole } from "@/lib/types/user";
import { RoleStudentCardIllustration } from "./illustrations/RoleStudentCardIllustration";
import { RoleMentorCardIllustration } from "./illustrations/RoleMentorCardIllustration";
import {
  MentorBenefitIcon1,
  MentorBenefitIcon2,
  MentorBenefitIcon3,
  StudentBenefitIcon1,
  StudentBenefitIcon2,
  StudentBenefitIcon3,
} from "./icons/AuthBenefitIcons";

type Selectable = Extract<AppRole, "student" | "mentor">;

const cards: {
  id: Selectable;
  shortLabel: string;
  title: string;
  lead: string;
  benefits: [string, string, string];
  tone: "blue" | "emerald";
}[] = [
  {
    id: "student",
    shortLabel: "학생",
    title: "학생으로 가입하기",
    lead: "멘토에게 질문하고 콘텐츠·멤버십 혜택을 학생 흐름에 맞게 시작해요.",
    benefits: [
      "질문·콘텐츠 이용(정책·요금제 기준)",
      "닉네임·학교·프로필로 멘토 탐색(제공 범위는 약관)",
      "알림·이벤트(선택 수신 시) 혜택 안내",
    ],
    tone: "blue",
  },
  {
    id: "mentor",
    shortLabel: "멘토",
    title: "멘토로 가입하기",
    lead: "대학 인증과 프로필을 바탕으로 멘티에게 답하며 멘토 활동을 시작해요.",
    benefits: [
      "대학(재) 인증·프로필·활동(승인/정책)",
      "질의응답·가이드(제공·과금)은 약관·정책",
      "심사·이의·갱신 시 자료·보관·삭제(운영)",
    ],
    tone: "emerald",
  },
];

const cardShadow = "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_36px_-12px_rgba(15,23,42,0.14)]";
const cardShadowSelectedBlue =
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_48px_-12px_rgba(14,165,233,0.28),0_8px_20px_-8px_rgba(2,132,199,0.2)]";
const cardShadowSelectedEmerald =
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_48px_-12px_rgba(16,185,129,0.26),0_8px_20px_-8px_rgba(4,120,87,0.18)]";

const studentIcons = [StudentBenefitIcon1, StudentBenefitIcon2, StudentBenefitIcon3] as const;
const mentorIcons = [MentorBenefitIcon1, MentorBenefitIcon2, MentorBenefitIcon3] as const;

type RoleSelectorProps = {
  value: Selectable | null;
  onChange: (r: Selectable) => void;
  disabled?: boolean;
};

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-8" role="group" aria-label="가입 유형">
      {cards.map((c) => {
        const selected = value === c.id;
        const isBlue = c.tone === "blue";
        const base = [
          "group relative flex w-full min-w-0 overflow-hidden text-left",
          "min-h-0 sm:min-h-[200px] lg:min-h-[220px]",
          "rounded-[1.75rem] border-2 p-4 transition sm:rounded-2xl sm:p-5 md:p-6 lg:p-7",
        ].join(" ");
        const focus =
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
          (isBlue ? "focus-visible:ring-sky-500" : "focus-visible:ring-emerald-500");
        const unselected = isBlue
          ? "border-slate-200/80 bg-gradient-to-br from-sky-50/90 via-white to-white hover:border-sky-300/90"
          : "border-slate-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-white hover:border-emerald-300/80";
        const selectedStyles = selected
          ? isBlue
            ? `border-sky-500/95 bg-gradient-to-br from-sky-100/55 via-sky-50/40 to-white ${
                cardShadowSelectedBlue
              } ring-2 ring-sky-500/30 ring-offset-[3px] ring-offset-sky-50/30`
            : `border-emerald-600/95 bg-gradient-to-br from-emerald-100/50 via-emerald-50/35 to-white ${
                cardShadowSelectedEmerald
              } ring-2 ring-emerald-500/30 ring-offset-[3px] ring-offset-emerald-50/20`
          : cardShadow;
        const icons = c.id === "student" ? studentIcons : mentorIcons;
        const heroBox = isBlue
          ? "border-sky-200/60 bg-gradient-to-b from-sky-100/75 via-sky-50/70 to-white"
          : "border-emerald-200/60 bg-gradient-to-b from-emerald-100/70 via-emerald-50/70 to-white";
        const benefitShell = isBlue
          ? "border-sky-200/50 bg-sky-50/40 shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset] shadow-sky-200/20"
          : "border-emerald-200/50 bg-emerald-50/30 shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset] shadow-emerald-200/20";

        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c.id)}
            className={`${base} ${focus} ${selected ? "" : unselected} ${selectedStyles} ${
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
            aria-pressed={selected}
          >
            {selected ? (
              <span
                className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-md sm:right-4 sm:top-4 sm:h-10 sm:w-10 ${
                  isBlue ? "bg-sky-600 text-white" : "bg-emerald-600 text-white"
                }`}
                aria-hidden
              >
                ✓
              </span>
            ) : null}
            <div className="flex w-full min-h-0 flex-col sm:flex-row sm:items-stretch sm:gap-4 md:gap-5">
              <div
                className={`mb-3 h-[min(9rem,38vw)] shrink-0 overflow-hidden rounded-2xl border sm:mb-0 sm:h-auto sm:min-h-[9.5rem] sm:w-[44%] sm:max-w-[13.5rem] md:min-h-[10.5rem] ${heroBox}`}
              >
                {c.id === "student" ? (
                  <RoleStudentCardIllustration className="h-full w-full min-h-[7.5rem] object-cover" />
                ) : (
                  <RoleMentorCardIllustration className="h-full w-full min-h-[7.5rem] object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col sm:min-h-0 sm:justify-center sm:pl-0">
                <span
                  className={`inline-flex w-fit max-w-full rounded-full px-3 py-1.5 text-xs font-extrabold tracking-wide ${
                    isBlue ? "bg-sky-100 text-sky-900 ring-1 ring-sky-200/60" : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/60"
                  }`}
                >
                  {c.shortLabel}
                </span>
                <span className="mt-2.5 block break-words text-2xl font-extrabold leading-snug text-slate-900 sm:mt-3 sm:text-[1.65rem] md:text-3xl">
                  {c.title}
                </span>
                <span className="mt-2 block text-sm leading-7 text-slate-600 sm:mt-2.5 sm:text-base sm:leading-7">
                  {c.lead}
                </span>
                <ul className="mt-4 grid list-none grid-cols-1 gap-2.5 sm:mt-4 sm:grid-cols-3 sm:gap-2 md:gap-2.5" role="list">
                  {c.benefits.map((b, i) => {
                    const Icon = icons[i]!;
                    return (
                      <li
                        key={b}
                        className={`flex min-h-[4.5rem] items-start gap-2.5 rounded-xl border px-2.5 py-2.5 sm:min-h-[5.5rem] md:px-3 md:py-2.5 ${benefitShell}`}
                      >
                        <span className="mt-0.5 shrink-0" aria-hidden>
                          <Icon />
                        </span>
                        <span className="min-w-0 text-left text-[12px] font-medium leading-5 text-slate-800 sm:text-[11px] md:text-[13px]">
                          {b}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div
              className={`mt-4 border-t sm:mt-4 md:mt-5 ${
                isBlue ? "border-sky-200/50" : "border-emerald-200/50"
              } pt-3.5 sm:pt-4`}
            >
              {selected ? (
                <span className={`text-sm font-bold sm:text-base ${isBlue ? "text-sky-800" : "text-emerald-800"}`}>
                  선택됨 — 아래 {c.id === "student" ? "학생" : "멘토"} 가입서를 이어갈 수 있어요
                </span>
              ) : (
                <span
                  className={`text-sm font-semibold sm:text-base ${isBlue ? "text-sky-600" : "text-emerald-700"}`}
                >
                  카드를 눌러 이 유형을 선택하세요
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
