# 쌤버십 작업 요약 (인계) — 2026-06-26

브랜치: `checkpoint/ui-coverage-20260516-133113` · HEAD `3190b99` (origin 동기화 완료)

## 완료된 작업

### 1. 수수료 정책 변경 (코드+DB 모두 적용·검증 완료)
- 맞춤의뢰 20%→5% (멘토 95%): `lib/customRequest/orderSettlementAmounts.ts`, `lib/mentor/mentorPayoutsConstants.ts` + SQL `supabase/sql/090_custom_order_fee_5pct.sql`
- 구독 30%→15% (멘토 85%): `lib/mentor/mentorPayoutsConstants.ts` + SQL `supabase/sql/095_subscription_fee_15pct.sql`
- 개별질문 0%→15% (멘토 85%): SQL `supabase/sql/096_individual_question_fee_15pct.sql`
- ★ SQL 3개(090/095/096) Supabase 실행 완료·검증됨(is_new=true, default 0.05/0.15). 정산 화면에 "15%/5% 공제" 정상 표시 확인.
- 불변식·멱등성 보존, 소급 없음(per-row fee_rate 베이크). 기존 055/070/086 미수정(새 번호 SQL).
- ⚠️ CLAUDE.md 잠금값(수수료 30/70·20/80)은 구값으로 남아있음 → 신 정책(15/5)으로 갱신 필요.

### 2. 231 버그수정 (커밋됨)
- 찜 500 에러: `lib/mentor/mentorFavorites.ts` 사전검사(mentorProfileExists) 제거
- 커뮤니티 문구 깨짐: `components/community/CommunityBoardDetail.tsx` bare 한글 `{"..."}` 래핑

### 3. 멘토 영입 자료 (별도 산출물, 레포 외)
- 멘토 실무 가이드(Word, 다이어그램+연결노트 예시+화면+수익구조), 영입 문자 2종.

### 4. 유저플로우 보고서 (tmp-screens/, gitignore 권장)
- 전체 화면 촬영 + 여정 흐름도 보고서. 병합 후 재촬영분 `tmp-screens/all-postmerge/`(91장).

## 동업자 main 병합 완료
- origin/main 31커밋 병합(충돌 0). 학적변경 화면·안전필터·개별질문 래퍼 SQL(089/091-094) + 우리 수수료(090/095/096) 공존.

## 다음 작업 — 디자인 마무리 (체크리스트 별도)
- `265_design_fix_checklist_FINAL.md` 참조(이 인계와 함께 전달).
- P1 내부데이터 노출(분쟁상세 DB덤프·알림 코드·dataPoints DB명·연결노트), P2 레이아웃(구독현황 칼럼 깨짐), P3 미완성화면 출시여부, P4 표시·색위계, P5 다듬기.
- 별도 코드조사: 주간 질문한도 갱신 로직, 데이터노출 공통컴포넌트.

## 미해결/주의
- 미완성 화면(학생 신고·연결노트, 멘토 채널, 알림 일부) = "준비 중"·API 미연결 → 출시 포함 여부 결정 필요.
- 요금제 구 가격 표시(랜딩 등) = 권장가라 보류, 추후 일괄.
- 개별질문 "answered 후 학생이 [해결됨] 안 누르면 멘토 무기한 미지급" = 정책 검토 필요.
