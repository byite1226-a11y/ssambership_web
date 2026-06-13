import Link from "next/link";
import type { CSSProperties } from "react";

export type CustomRequestHeroProps = {
  role?: string | null;
};

function CheckIcon() {
  return (
    <svg className="ico" width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function CustomRequestHero({ role = null }: CustomRequestHeroProps) {
  const isMentor = role === "mentor";

  const primaryHref = isMentor ? "/mentor/custom-request/dashboard" : "/custom-request/new";
  const primaryLabel = isMentor ? "내 진행 의뢰 보기" : "의뢰 요청 등록하기";
  const secondaryHref = isMentor ? "/mentor/custom-request/posts" : "/custom-request/orders";
  const secondaryLabel = isMentor ? "새 의뢰 목록 보기" : "내 진행 의뢰 보기";

  return (
    <section className="hero">
      <div className="wrap">
        <div className="cols">
          <div className="txt">
            <span className="eyebrow">맞춤의뢰</span>
            <h1>
              전문 멘토에게
              <br />
              의뢰하세요
            </h1>
            <p className="lead">
              요청을 올리면 검증된 현직 대학생 멘토들이 제안을 보내요. 비교하고 한 분을 골라, 작업방에서 안전하게 끝까지
              이어가요.
            </p>
            <ul className="mini">
              <li>
                <span className="ck">
                  <CheckIcon />
                </span>
                검증된 현직 대학생 멘토
              </li>
              <li>
                <span className="ck">
                  <CheckIcon />
                </span>
                여러 제안을 비교하고 직접 선택
              </li>
              <li>
                <span className="ck">
                  <CheckIcon />
                </span>
                안전한 에스크로 결제·분쟁 보호
              </li>
            </ul>
            <div className="cta-row">
              <Link href={primaryHref} className="btn btn-primary">
                {primaryLabel}
              </Link>
              <Link href={secondaryHref} className="btn btn-ghost">
                {secondaryLabel}
              </Link>
            </div>
          </div>

          <div className="vis">
            <div className="stage">
              <span className="glow g1" aria-hidden />
              <span className="glow g2" aria-hidden />
              <div className="obj cap" style={{ "--rot": "-12deg" } as CSSProperties}>
                <svg className="ico" width="30" height="30" viewBox="0 0 24 24" aria-hidden>
                  <path d="M22 10L12 5 2 10l10 5 10-5z" />
                  <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
                </svg>
              </div>
              <div className="obj star" style={{ "--rot": "14deg" } as CSSProperties}>
                <svg className="ico" width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 21 12 17.3 6.5 21 8 13.3 3 9l6.4-.7L12 2z" />
                </svg>
              </div>
              <div className="obj coin" style={{ "--rot": "8deg" } as CSSProperties}>
                <span className="won">₩</span>
              </div>

              <div className="preview">
                <div className="pv-head">
                  <span className="ti">받은 제안</span>
                  <span className="ct">
                    <svg className="ico" width="13" height="13" viewBox="0 0 24 24" aria-hidden>
                      <path d="M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                    </svg>
                    멘토 3명
                  </span>
                </div>
                <div className="pv-req">
                  <span className="l">수학 내신 대비 코치</span>
                  <span className="r">예산 50,000원</span>
                </div>
                <div className="pvlabel">멘토 제안</div>
                <div className="prow sel">
                  <span className="av a">김</span>
                  <span className="nm">
                    <div className="n">김O준 멘토</div>
                    <div className="s">서울대 수학교육 · 응답 빠름</div>
                  </span>
                  <span>
                    <div className="pr">48,000원</div>
                    <div className="pk">
                      <svg className="ico" width="11" height="11" viewBox="0 0 24 24" aria-hidden>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      선택
                    </div>
                  </span>
                </div>
                <div className="prow">
                  <span className="av b">이</span>
                  <span className="nm">
                    <div className="n">이O서 멘토</div>
                    <div className="s">연세대 응용통계 · 후기 24</div>
                  </span>
                  <span className="pr">52,000원</span>
                </div>
                <div className="prow" style={{ marginBottom: 0 }}>
                  <span className="av c">박</span>
                  <span className="nm">
                    <div className="n">박O현 멘토</div>
                    <div className="s">고려대 수학 · 첨삭 전문</div>
                  </span>
                  <span className="pr">50,000원</span>
                </div>
              </div>

              <div className="obj check" style={{ "--rot": "-8deg" } as CSSProperties}>
                <svg className="ico" width="26" height="26" viewBox="0 0 24 24" aria-hidden>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div className="obj chat" style={{ "--rot": "7deg" } as CSSProperties}>
                <svg className="ico" width="26" height="26" viewBox="0 0 24 24" aria-hidden>
                  <path d="M21 11.5a8.4 8.4 0 01-9 8.4L3 21l1.1-4A8.4 8.4 0 1121 11.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
