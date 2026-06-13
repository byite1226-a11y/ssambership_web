function StepArrow() {
  return (
    <span className="arrow" aria-hidden>
      <svg className="ico" width="22" height="22" viewBox="0 0 24 24">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </span>
  );
}

export function CustomRequestSteps() {
  return (
    <>
      <div className="sec-head">
        <span className="eyebrow">이용 순서</span>
        <h2>맞춤의뢰, 이렇게 진행돼요</h2>
        <p>요청 등록부터 납품 확인까지, 네 단계면 충분해요.</p>
      </div>
      <div className="steps">
        <div className="step">
          <span className="ticon blue">
            <svg className="ico" width="27" height="27" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </span>
          <div className="sn">STEP 1</div>
          <h4>의뢰 등록</h4>
          <p>필요한 내용·예산·희망 일정을 정리해 올려요.</p>
          <StepArrow />
        </div>
        <div className="step">
          <span className="ticon blue">
            <svg className="ico" width="27" height="27" viewBox="0 0 24 24" aria-hidden>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>
          <div className="sn">STEP 2</div>
          <h4>멘토 지원</h4>
          <p>멘토들이 의뢰를 보고 제안을 보내요.</p>
          <StepArrow />
        </div>
        <div className="step">
          <span className="ticon blue">
            <svg className="ico" width="27" height="27" viewBox="0 0 24 24" aria-hidden>
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </span>
          <div className="sn">STEP 3</div>
          <h4>멘토 선택</h4>
          <p>제안을 비교하고 한 분을 골라요.</p>
          <StepArrow />
        </div>
        <div className="step">
          <span className="ticon blue">
            <svg className="ico" width="27" height="27" viewBox="0 0 24 24" aria-hidden>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </span>
          <div className="sn">STEP 4</div>
          <h4>납품 확인</h4>
          <p>납품 파일을 확인하고 완료하면 끝이에요.</p>
        </div>
      </div>
    </>
  );
}
