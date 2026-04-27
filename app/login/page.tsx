import Link from "next/link";
import { LoginStudentHeroIllustration } from "@/components/auth/illustrations/LoginStudentHeroIllustration";
import { LoginMentorHeroIllustration } from "@/components/auth/illustrations/LoginMentorHeroIllustration";

function BrandLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-[#0b2b6c]">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#123d8e] text-white"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M3 10 12 4l9 6-9 6-9-6Zm2.5 2.8L12 17l6.5-4.2V16L12 20l-6.5-4v-3.2Z" />
        </svg>
      </span>
      <span className="text-[1.75rem] font-extrabold leading-none tracking-[-0.03em]">쌤버십</span>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4ZM20.2 20.2l-4.2-4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SocialRow() {
  const base =
    "inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[17px] font-semibold text-slate-700";
  return (
    <>
      <p className="text-center text-[15px] font-bold text-slate-500">또는</p>
      <div className="grid grid-cols-3 gap-3">
        <button type="button" className={base} disabled>
          <span className="text-[20px] font-bold text-[#EA4335]">G</span>
          Google
        </button>
        <button type="button" className={base} disabled>
          <span className="rounded-full bg-[#FEE500] px-2.5 py-1 text-[13px] font-extrabold text-[#191919]">톡</span>
          카카오
        </button>
        <button type="button" className={base} disabled>
          <span className="rounded-[4px] bg-[#03C75A] px-2 py-1 text-[13px] font-extrabold text-white">N</span>
          네이버
        </button>
      </div>
    </>
  );
}

function BenefitCell({ title, description }: { title: string; description: string }) {
  return (
    <li className="rounded-xl border border-white bg-white/95 px-3 py-3 text-center">
      <p className="text-[14px] font-extrabold leading-5 text-slate-900">{title}</p>
      <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-600">{description}</p>
    </li>
  );
}

function LandingCard({
  role,
  title,
  badge,
  line1,
  line2,
  ctaLabel,
  loginPath,
  signupLabel,
  benefits,
}: {
  role: "student" | "mentor";
  title: string;
  badge: string;
  line1: string;
  line2: string;
  ctaLabel: string;
  loginPath: string;
  signupLabel: string;
  benefits: { title: string; description: string }[];
}) {
  const student = role === "student";
  return (
    <section
      className={`rounded-2xl border p-5 lg:p-6 ${
        student ? "border-[#c9defe] bg-[#f3f8ff]" : "border-[#ccecdf] bg-[#f2fbf8]"
      }`}
    >
      <span
        className={`inline-flex rounded-full px-3 py-1 text-sm font-extrabold ${
          student ? "bg-[#e2edff] text-[#2d4f8f]" : "bg-[#daf4ea] text-[#216c56]"
        }`}
      >
        {badge}
      </span>
      <h2 className="mt-3 text-[50px] font-black leading-[1.06] tracking-[-0.03em] text-slate-900">{title}</h2>
      <p className="mt-3 text-[31px] font-extrabold leading-[1.35] tracking-[-0.02em] text-slate-800">{line1}</p>
      <p className="text-[31px] font-extrabold leading-[1.35] tracking-[-0.02em] text-slate-800">{line2}</p>

      <div className="relative mt-3 h-[260px] overflow-hidden rounded-xl">
        {student ? (
          <LoginStudentHeroIllustration className="h-full w-full scale-[1.18] object-contain object-bottom-right" />
        ) : (
          <LoginMentorHeroIllustration className="h-full w-full scale-[1.18] object-contain object-bottom-right" />
        )}
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        {benefits.map((item) => (
          <BenefitCell key={`${item.title}-${item.description}`} title={item.title} description={item.description} />
        ))}
      </ul>

      <Link
        href={loginPath}
        className={`mt-4 inline-flex h-[58px] w-full items-center justify-center rounded-xl text-[23px] font-extrabold text-white ${
          student ? "bg-[#1462ff]" : "bg-[#058b65]"
        }`}
      >
        {ctaLabel}
      </Link>

      <div className="mt-3">
        <SocialRow />
      </div>

      <p className="mt-4 text-center text-[19px] font-semibold text-slate-700">
        {role === "student" ? "학생 계정이 없으신가요? " : "멘토 계정이 없으신가요? "}
        <Link href="/signup" className="font-extrabold text-[#1f4e97] underline underline-offset-4">
          {signupLabel}
        </Link>
      </p>
    </section>
  );
}

function InfoBlock() {
  return (
    <section className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
      {[
        { title: "안내 사항", desc: "무료 질문권은 가입 직후 제공되며 정책에 따라 사용됩니다." },
        { title: "무료 질문권 15장 제공", desc: "회원가입 시 15장의 무료 질문권이 제공됩니다." },
        { title: "한 멘토당 최대 3개 질문", desc: "무료 질문은 멘토별로 최대 3개까지 가능합니다." },
        { title: "여러 멘토에게 사용 가능", desc: "무료 질문권은 다른 멘토에게 나누어 사용할 수 있습니다." },
      ].map((item) => (
        <div key={item.title} className="border-b border-r border-slate-200 p-5 last:border-b-0 lg:last:border-r-0">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#bcd4ff] text-[#1f58c6]">
            i
          </div>
          <p className="mt-2 text-[22px] font-extrabold leading-tight text-slate-900">{item.title}</p>
          <p className="mt-1 text-[16px] font-medium leading-6 text-slate-600">{item.desc}</p>
        </div>
      ))}
    </section>
  );
}

type LoginPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage(props: LoginPageProps) {
  const termsUrl = process.env.NEXT_PUBLIC_LEGAL_TERMS_URL;
  const privacyUrl = process.env.NEXT_PUBLIC_LEGAL_PRIVACY_URL;
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL;
  const sp = (await props.searchParams) ?? {};
  const raw = sp.next;
  const nextVal = (typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null) ?? null;
  const nextQ = nextVal ? `?next=${encodeURIComponent(nextVal)}` : "";

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[84px] w-full max-w-[1680px] items-center justify-between px-10">
          <BrandLogo />
          <nav className="flex items-center gap-14">
            <Link href="/mentors" className="text-[27px] font-bold text-slate-800">
              멘토 찾기
            </Link>
            <Link href="/login" className="text-[27px] font-bold text-slate-800">
              질문방
            </Link>
            <Link href="/community" className="text-[27px] font-bold text-slate-800">
              커뮤니티
            </Link>
            <Link href="/custom-request" className="text-[27px] font-bold text-slate-800">
              맞춤의뢰
            </Link>
            <Link href="/cash" className="text-[27px] font-bold text-slate-800">
              캐시결제
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="검색"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-800"
            >
              <SearchIcon />
            </button>
            <Link
              href="/login"
              className="inline-flex h-[46px] min-w-[96px] items-center justify-center rounded-[12px] border border-[#cdd7ee] px-5 text-[20px] font-extrabold text-[#1d3f86]"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-[46px] min-w-[110px] items-center justify-center rounded-[12px] bg-[#0b63ff] px-5 text-[20px] font-extrabold text-white"
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-10 pb-12 pt-12">
        <h1 className="text-center text-[72px] font-black leading-none tracking-[-0.04em] text-[#0f63ff]">로그인이 필요해요</h1>
        <p className="mt-4 text-center text-[31px] font-semibold tracking-[-0.02em] text-slate-700">
          학생과 멘토 각각의 서비스를 이용해보세요.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-8">
          <LandingCard
            role="student"
            badge="질문하고 배우는 학생이라면"
            title="학생 로그인"
            line1="전문 멘토에게 질문하고"
            line2="맞춤형 답변을 받아보세요."
            ctaLabel="학생 로그인"
            loginPath={`/login/student${nextQ}`}
            signupLabel="학생 회원가입"
            benefits={[
              { title: "가입 시 무료 질문권", description: "15장 제공" },
              { title: "무료 질문은", description: "한 멘토당 최대 3개" },
              { title: "여러 멘토에게", description: "나눠서 사용 가능" },
            ]}
          />
          <LandingCard
            role="mentor"
            badge="답변하고 성장하는 멘토라면"
            title="멘토 로그인"
            line1="학생 질문에 답변하고"
            line2="지식과 경험을 나눠주세요."
            ctaLabel="멘토 로그인"
            loginPath={`/login/mentor${nextQ}`}
            signupLabel="멘토 회원가입"
            benefits={[
              { title: "질문방 관리 및", description: "답변 작성" },
              { title: "연결노트 · 콘텐츠", description: "작성 및 업로드" },
              { title: "정산 확인 및", description: "수익 관리" },
            ]}
          />
        </div>

        <div className="mt-6">
          <InfoBlock />
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-8">
          <div className="flex items-end justify-between">
            <div>
              <BrandLogo />
              <nav className="mt-3 flex items-center gap-6 text-[20px] font-semibold text-slate-700">
                {termsUrl ? (
                  <a href={termsUrl} target="_blank" rel="noopener noreferrer">
                    이용약관
                  </a>
                ) : (
                  <span>이용약관</span>
                )}
                {privacyUrl ? (
                  <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
                    개인정보처리방침
                  </a>
                ) : (
                  <span>개인정보처리방침</span>
                )}
                {supportUrl ? (
                  <a href={supportUrl} target="_blank" rel="noopener noreferrer">
                    고객센터
                  </a>
                ) : (
                  <span>고객센터</span>
                )}
              </nav>
              <p className="mt-1 text-[18px] font-medium text-slate-500">© SSAMBESHIP. All rights reserved.</p>
            </div>
            <div className="rounded-2xl border border-[#d4efdf] bg-[#f4fcf7] px-5 py-4">
              <p className="text-[23px] font-extrabold text-slate-900">안전한 결제 시스템</p>
              <p className="mt-1 text-[17px] font-medium text-slate-600">모든 결제 정보는 안전하게 암호화되어 보호됩니다.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
