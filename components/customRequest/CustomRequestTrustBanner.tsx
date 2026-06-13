export function CustomRequestTrustBanner() {
  return (
    <div className="trust" aria-label="거래 안내">
      <span className="ticon blue" style={{ flex: "none" }}>
        <svg className="ico" width="27" height="27" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        </svg>
      </span>
      <div style={{ flex: 1 }}>
        <div className="ph-eyebrow">안전·신뢰</div>
        <h3>안전하고 올바른 학습 문화를 함께 만들어요</h3>
        <ul>
          <li>
            <svg className="ico ck" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            제출용 과제·보고서·논문 등의 작성 대행은 제공하지 않아요.
          </li>
          <li>
            <svg className="ico ck" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            부정행위·표절·복사/붙여넣기 제출을 유도하는 요청은 허용하지 않아요.
          </li>
          <li>
            <svg className="ico ck" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            모든 상담과 거래는 플랫폼 내에서 안전하게 이루어집니다.
          </li>
        </ul>
      </div>
    </div>
  );
}
