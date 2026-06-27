# 216 Functional Coverage Audit

기준일: 2026-06-19 KST  
범위: 현재 웹 코드 + 기능 스펙 정적 점검. DB/SQL 실행, 코드 수정, 커밋, 푸시는 하지 않았다.  
허용 변경: 이 보고서 파일 생성만.

## 1. 레포 현황 요약

### 1.1 Git 조회 결과

| 항목 | 결과 |
|---|---|
| remote | `origin https://github.com/byite1226-a11y/ssambership_web.git` |
| 현재 브랜치 | `checkpoint/ui-coverage-20260516-133113` |
| fetch | `origin/main`이 `1d164db..a3fa305`로 갱신됨. 최초 fetch는 `.git/FETCH_HEAD` 권한 문제로 실패했고, 승인된 escalated fetch로 성공. |
| 작업트리 dirty | `.claude/settings.local.json`, `tsconfig.tsbuildinfo`, `supabase/bundles/` |
| 커밋됐지만 GitHub 미푸시 | `25`개 (`origin/checkpoint/ui-coverage-20260516-133113..HEAD`) |
| main 대비 현재 HEAD 미반영 총량 | `41`개 (`origin/main..HEAD`) |
| GitHub 원격 브랜치에는 있으나 main 미반영 | `16`개 (`origin/main..origin/checkpoint/ui-coverage-20260516-133113`) |

### 1.2 3단계 구분

| 단계 | 상태 | 목록 |
|---|---|---|
| 1. 로컬에만 있음 | 커밋 전 변경은 사용자 지정 ignore 대상만 확인됨. 이 보고서 생성 후에는 `docs/audit/functional_coverage.md`가 추가 dirty 파일이 된다. | `.claude/settings.local.json`, `tsconfig.tsbuildinfo`, `supabase/bundles/` |
| 2. 커밋됐지만 GitHub 미푸시 | `25`개 | 아래 "미푸시 커밋" 참조 |
| 3. GitHub에는 있으나 main 미반영 | 원격 checkpoint 기준 `16`개. `origin/main..HEAD`는 `41`개이며, 여기에는 위 25개 로컬 미푸시 커밋도 포함된다. | 아래 "원격 브랜치 only 커밋" 참조 |

미푸시 커밋 (`origin/checkpoint/ui-coverage-20260516-133113..HEAD`):

```text
f9577ee A-4: 학교 인증 배지 표시 + 자유입력 강등 + 필터 검증값화(probes 정리)
1fcd498 P0: 공개 멘토 RPC 화이트리스트(PII 차단) v2
008894e P0: 인증 서류 사진 공개 노출 차단(앱 레이어)
94d395a 학교 서류 업로드 파일명 안전화 (Invalid key 수정)
a941bee A-3 관리자 학교·전공 심사
32f7539 학교 인증 폼 encType 경고 제거
f2c928d A-2 멘토 학교 증명 서류 업로드
20db917 정산 화면 색 위계 정리(의미별 색)
110729a 정산 화면 멘토 초록 액센트 + 빈상태 콤팩트
44491cc 미리보기 sticky 제거·배경 흰색(띠 유지)
36351d0 미리보기 학생화면 차별 신호
86d9cf6 미리보기 컬럼 sticky 고정
5532fe5 미리보기 학교전공·학년 배치 정리
2b8243d 미리보기 카드 좌측 섹션 카드와 구조 통일
337e704 미리보기 카드 테두리 #1A56DB 통일
0f4b77d 미리보기 카드 테두리 옅은 파랑
ad05258 미리보기 카드 테두리 굵기 통일
769eea5 프로필 미리보기 카드 정리(테두리·중첩·빈값)
e9bd183 학생 마이페이지 통계칸·진행중질문 재배치
30349ef 프로필 미리보기 카드 외형 통일
c4a8480 멘토 요금 저장: 없는 컬럼 SELECT 제거 (가격 저장 버그)
5abfa52 멘토 프로필 대시보드형 카드
e9c6609 디자인: 카드 간격 + 과목 셀렉트 화살표
58cd940 멘토 요금제 input step 100→1 (가격 저장 버그 수정)
2ed227d 토큰 정리 C-1·C-2 (화면 0변화)
```

원격 브랜치 only 커밋 (`origin/main..origin/checkpoint/ui-coverage-20260516-133113`):

```text
04b8b44 프로필·마이페이지 테두리·색 마감
e9c783f feat(개별질문 멘토 개편): 요약 스트립 + 카드 정보 보강 + 콤팩트 빈상태
bb907d7 fix(색값 고정: 파랑 #1A56DB / 완료 #059669): 브랜드 블루·완료색 단일화
16089a3 fix(역할색 묶음1): 멘토 정체성 보라→초록(#16A34A) 통일
e71d953 fix(hover 묶음3): 멘토 마이페이지 진행 의뢰 카드 톤 통일 + 카드 hover 통일 마무리
3394ccb fix(hover 묶음2): 학생측 상태 카드 회색 hover→상태색 테두리+그림자
dddeef0 fix(hover 묶음1): 맞춤의뢰 멘토 목록 카드 회색 hover→상태색 테두리+그림자
e3943f7 fix: 회색 카드/타일 정리 + 목록 카드 hover 회색 제거→tone 테두리 강조
1f2d5ff fix: login error copy/tone — remove internal diagnostics, role mismatch as info notice
d9bb92b feat: B-1 unify community/mentor detail cards via SurfaceCard
4e344f0 feat: connection notes mobile toggle + owner-only edit/delete (RLS hardening)
a25ca55 feat: unify list cards (stage 3 final: community posts + mentor directory)
98bd792 feat: unify list cards (stage 2: student question-room threads + individual-question lists)
de37c7d feat: show student subscription plan and weekly remaining on mentor question-room
1aaddd4 fix: deepen connection-note color tone (weekly-renewal widget verified intact, not removed by prior change)
e30251d feat: redesign connection notes panel (two-column by author, relationship metrics, wider, app-blue tone)
```

## 2. 라우트 인벤토리

### 2.1 Admin

| 그룹 | page routes |
|---|---|
| 관리자 콘솔 | `/admin`, `/admin/dashboard`, `/admin/audit-logs`, `/admin/custom-request-orders`, `/admin/disputes`, `/admin/disputes/[id]`, `/admin/mentor-approval`, `/admin/mentor-approvals`, `/admin/mentor-approvals/[id]`, `/admin/mentors`, `/admin/moderation`, `/admin/notices`, `/admin/refunds`, `/admin/refunds/[id]`, `/admin/refunds-settlement`, `/admin/reports`, `/admin/reports/[id]`, `/admin/reviews`, `/admin/reviews/[reviewId]`, `/admin/settings`, `/admin/settlements` |
| 관리자 인증 | `/admin/login` |

### 2.2 Mentor

| 그룹 | page routes |
|---|---|
| 홈/프로필/인증 | `/mentor/mypage`, `/mentor/profile`, `/mentor/profile/edit`, `/mentor/verification`, `/mentor/channel`, `/mentor/reviews` |
| 구독 질문방 | `/mentor/question-room`, `/mentor/question-room/[roomId]`, `/mentor/question-room/[roomId]/thread/[threadId]`, `/mentor/questions`, `/mentor/questions/[roomId]` |
| 맞춤의뢰 | `/mentor/custom-request`, `/mentor/custom-request/dashboard`, `/mentor/custom-request/posts`, `/mentor/custom-request/posts/[postId]`, `/mentor/custom-request/posts/[postId]/apply`, `/mentor/custom-request/orders`, `/mentor/custom-request/orders/[orderId]`, `/mentor/custom-request/orders/[orderId]/files`, `/mentor/custom-request/orders/[orderId]/revision`, `/mentor/custom-request/orders/[orderId]/room`, `/mentor/custom-request/orders/[orderId]/waiting-review` |
| 개별질문 | `/mentor/individual-questions`, `/mentor/individual-questions/[questionId]` |
| 정산/지원 | `/mentor/payouts`, `/mentor/payouts/detail`, `/mentor/support/disputes`, `/mentor/support/disputes/[id]` |
| 커뮤니티 | `/mentor/community/new` |

### 2.3 Student

| 그룹 | page routes |
|---|---|
| 홈/마이페이지 | `/student/home`, `/student/mypage`, `/student/notes` |
| 구독 질문방 | `/student/subscribe`, `/student/subscribe/success`, `/student/subscribe/fail`, `/student/subscribe/cancelled`, `/student/subscriptions`, `/student/question-room`, `/student/question-room/[roomId]`, `/student/question-room/[roomId]/thread/[threadId]`, `/student/questions`, `/student/questions/[roomId]`, `/student/qna/question-room` |
| 캐시/지갑 | `/student/wallet`, `/student/wallet/charge`, `/student/wallet/charge/success`, `/student/wallet/charge/fail`, `/student/wallet/ledger`, `/student/cash-history` |
| 맞춤의뢰 | `/student/custom-request/new`, `/student/custom-request/posts`, `/student/custom-request/[postId]/applications`, `/student/custom-request/[postId]/applications/waiting`, `/student/custom-request/orders/[orderId]/complete` |
| 개별질문 | `/student/individual-questions`, `/student/individual-questions/new`, `/student/individual-questions/[questionId]`, `/student/mentors/[mentorId]/individual-question/new` |
| 지원 | `/student/support/disputes`, `/student/support/disputes/[id]`, `/student/support/refunds`, `/student/support/reports` |

### 2.4 Public/Auth

| 그룹 | page routes |
|---|---|
| 공개/랜딩 | `/`, `/mentors`, `/mentors/[mentorId]`, `/pricing`, `/cash`, `/payments`, `/notices`, `/notifications`, `/support`, `/legal/terms`, `/legal/privacy` |
| 인증 | `/login/student`, `/login/mentor`, `/signup`, `/forgot-password`, `/auth/update-password` |
| 커뮤니티 | `/community`, `/community/board`, `/community/board/[id]`, `/community/me`, `/community/new`, `/community/posts`, `/community/shortform`, `/community/shortform/[id]`, `/community/shortform/new`, `/community/shorts`, `/community/shorts/[id]`, `/community/write` |
| 맞춤의뢰 공개/학생 호환 | `/custom-request`, `/custom-request/[postId]`, `/custom-request/orders`, `/custom-request/orders/[orderId]`, `/custom-request/orders/[orderId]/review` |
| 기타 | `/dev/design-system` |

### 2.5 API/Route Handlers

| 영역 | route handlers |
|---|---|
| 커뮤니티 | `/api/community/posts` |
| cron | `/api/cron/individual-question-expiry`, `/api/cron/subscription-renewal` |
| 멘토/정산 | `/api/mentor/payouts/detail`, `/api/mentor/payouts/monthly`, `/api/mentor/payouts/summary`, `/api/mentors/favorites` |
| 마이페이지/구독 | `/api/mypage/active-subscriptions`, `/api/subscribe/checkout` |
| 질문방 | `/api/question-room/threads`, `/api/question-room/threads/[threadId]/answer`, `/api/question-room/threads/[threadId]/confirm`, `/api/question-room/threads/[threadId]/wrong-answer`, `/api/question-room/weekly-usage` |
| 리뷰 | `/api/reviews`, `/api/reviews/[id]/hide`, `/api/reviews/[id]/reply`, `/api/reviews/eligibility` |
| 결제 | `/api/toss/confirm`, `/api/toss/webhook` |
| 세션 | `/logout` |

## 3. 도메인별 커버리지 표

| 도메인 | 기능 | 상태 | 근거(연결된 RPC·파일 또는 미완 신호) | 비고 |
|---|---|---|---|---|
| 인증 | 이메일 로그인/가입/비밀번호 재설정 | 동작 가능 | `/login/*`, `/signup`, `/forgot-password`, `/auth/update-password`, `components/auth/RoleLoginForm.tsx` | 런타임 세션 쿠키 확인 필요 |
| 인증 | 역할별 route guard | 부분 | `lib/auth/routeGuard.ts:41-55` | `profile === null`인 student/mentor 세션을 차단하지 않는 P1 잔존 |
| 인증 | 소셜 로그인 | 미구현·스텁 | `components/auth/SocialAuthButtons.tsx:104-122` | Google/Kakao/Naver 버튼 disabled |
| 인증 | 멘토 가입/승인 | 동작 가능 | `app/(admin)/admin/(console)/mentor-approval`, `lib/admin/mentorApprovalActions.ts` | 기존 `verification_status` 흐름 유지 |
| 인증 | 학교·전공 인증 A단계 | 부분 | `supabase/sql/077_mentor_school_verification.sql`, `lib/mentor/mentorSchoolVerificationActions.ts`, `components/admin/AdminMentorApprovalWorkspace.tsx`, `lib/mentor/mentorDisplayFields.ts` | 코드상 A-1~A-4 연결. 단 078 SQL의 staging 적용 여부는 런타임 확인 필요 |
| 공개 멘토 | P0 앱 레이어 서류사진 차단 | 동작 가능 | `lib/mentor/mentorDisplayFields.ts:85-89` | `student_id_image_url`은 공개 사진 후보에서 빠짐 |
| 공개 멘토 | 공개 RPC PII 화이트리스트 v2 | 부분 | `supabase/sql/078_p0_public_mentor_read_rpc_v2.sql`, `lib/auth/mentorPublicRead.ts:72,106,134` | SQL Editor 적용 후 anon 응답 검증 필요 |
| 공개 멘토 | 인증 배지/자유입력 강등/검증값 필터 | 동작 가능(정적) | `lib/mentor/mentorDisplayFields.ts:56-75`, `lib/mentor/mentorsListSearchParams.ts:1-7,25-39,96-99`, `lib/mentor/publicMentorsListQueries.ts:260-323` | 필터는 현재 클라이언트가 받은 v2 컬럼 기준 |
| 구독·질문방 | 구독 결제→room 생성 | 동작 가능 | `/api/subscribe/checkout`, `lib/subscribe/subscribeCheckoutService.ts`, `record_subscription_cash_debit` RPC | 결제/원장/room 실제 트랜잭션은 런타임 확인 필요 |
| 구독·질문방 | thread/message/답변/확정/오답 | 동작 가능 | `/api/question-room/threads*`, `lib/qna/questionRoomActions.ts` | 학생/멘토 권한별 실제 전송 확인 필요 |
| 구독·질문방 | 연결노트 | 동작 가능 | `supabase/sql/076_connection_notes_owner_edit.sql`, `components/qna/QuestionRoomNewNoteModal.tsx` | owner-only edit/delete RLS 적용 이력 있음 |
| 구독·질문방 | 주간 quota | 동작 가능 | `supabase/sql/032_p0_weekly_question_usage.sql`, `/api/question-room/weekly-usage`, `lib/qna/weeklyQuestionUsage.ts` | 주차 경계/구독 갱신 런타임 확인 필요 |
| 캐시·지갑 | Toss 카드 충전 | 동작 가능 | `/api/toss/confirm`, `/api/toss/webhook`, `lib/toss/cashTopupFromPayment.ts`, `supabase/sql/020_p0_cash_topup_charge.sql` | 실제 Toss sandbox/운영 webhook 확인 필요 |
| 캐시·지갑 | 원장/사용내역 | 동작 가능 | `/student/wallet/ledger`, `lib/cash/cashQueries.ts` | append-only 불변식은 SQL/RPC 기준으로 추가 검증 권장 |
| 캐시·지갑 | 비카드 충전수단 | 미구현·스텁 | `components/cash/CashChargeWidget.tsx` | 카드 외 결제수단은 준비 중 |
| 맞춤의뢰 | 요청→지원→선택→주문 | 동작 가능 | `lib/customRequest/customRequestComposeActions.ts`, `customRequestApplicationActions.ts`, `customRequestOrderActions.ts` | 핵심 화면/액션 연결됨 |
| 맞춤의뢰 | 결제 hold/정산/release/refund | 동작 가능(정적) | `lib/customRequest/customOrderEscrowService.ts`, SQL `054`, `055`, `056`, `057`, `043` | 돈 흐름은 반드시 staging 런타임 검증 필요 |
| 맞춤의뢰 | 납품→수정→수락→종료 | 동작 가능 | `lib/customRequest/orderMentorActions.ts`, `orderStudentActions.ts`, `orderRevisionActions.ts`, `components/customRequest/order/*` | 파일 업로드/상태 전환 존재 |
| 맞춤의뢰 | 주문 채팅 파일 첨부/파일 미리보기 | 부분 | `components/customRequest/order/OrderProgressSection.tsx:410`, `components/customRequest/MentorOrderFilesView.tsx:128` | 메시지 파일 첨부와 미리보기는 준비 중 |
| 맞춤의뢰 | 분쟁 | 부분 | `lib/customRequest/orderDisputeActions.ts`, `lib/admin/adminDisputeActions.ts:205` | 분쟁 처리/분할은 있으나 운영 메모 저장 필드 부재 |
| 개별질문 | 직접 질문 작성 | 동작 가능 | `lib/individualQuestion/individualQuestionActions.ts:189-255`, RPC `create_individual_question_with_hold` | approved mentor 가격 확인 후 hold |
| 개별질문 | 공개 질문 작성 | 동작 가능 | `lib/individualQuestion/individualQuestionActions.ts:257-312`, RPC `create_individual_question_with_hold` | 자유 금액, 양수 검증 |
| 개별질문 | 공개 질문 claim | 부분 | `lib/individualQuestion/individualQuestionActions.ts:314-350`, `supabase/sql/070_individual_question_schema_escrow.sql:592-631` | 승인 멘토 여부만 확인. 학교군/계열 자격 하드차단(D)은 없음 |
| 개별질문 | 다운로드/첨부 게이트 | 부분 | `lib/individualQuestion/individualQuestionAttachmentStorage.ts`, `IndividualQuestionViews.tsx` | 접근 게이트는 있으나 magic byte 검증 P2는 미확인/미완 |
| 개별질문 | 만료 환불 cron | 동작 가능(정적) | `/api/cron/individual-question-expiry`, `lib/individualQuestion/individualQuestionExpiryBatch.ts` | cron secret/스케줄/중복 환불은 런타임 확인 필요 |
| 커뮤니티 | 게시판/숏폼 작성·조회 | 부분 | `lib/community/*`, `/community/*`, `components/community/CommunityPostDetail.tsx:159,262` | 작성/조회는 연결. 영상 재생/추천 일부 준비 중 |
| 커뮤니티 | 댓글·신고·검수 | 동작 가능(정적) | `components/community/CommunityBoardDetail.tsx`, `lib/community/communityReportActions.ts`, `components/admin/AdminContentReportsTable.tsx` | 신고/검수 admin 경로 존재 |
| 커뮤니티 | 좋아요/반응 | 부분 | `components/community/CommunityPostDetail.tsx` | 일부 상세 UI에서 좋아요 준비 중 신호 |
| 정산·환불 | 관리자 환불 | 동작 가능(정적) | `lib/admin/refundActions.ts`, SQL `030_p0_refund_approve_reject_admin_rpc.sql` | 돈 흐름 staging 검증 필요 |
| 정산·환불 | 맞춤의뢰 정산/분쟁 split | 동작 가능(정적) | SQL `055`, `057`, admin disputes/settlements pages | 실제 원장/중복처리 런타임 확인 필요 |
| 정산·환불 | 멘토 정산 조회 | 부분 | `/api/mentor/payouts/*`, `lib/mentor/mentorPayoutsQueries.ts:88` | 데이터 없을 때 안내/probe fallback |
| 정산·환불 | 멘토 정산 계좌 저장 | 미구현·스텁 | `lib/mentor/mentorPayoutAccountActions.ts:27-28` | 컬럼이 없으면 “계좌 정보 저장 기능 준비 중” 반환 |
| 관리자 | 승인·검수·신고·환불·정산·리뷰·이벤트·로그 | 부분 | admin route inventory, `lib/admin/*Actions.ts`, `components/admin/AdminActionPlaceholders.tsx` | 핵심 화면은 있으나 검색/기간 필터 placeholder 등 운영 편의 일부 미완 |
| 관리자 | 학교·전공 검증값 입력/승인 | 동작 가능 | `lib/admin/mentorSchoolVerificationReviewActions.ts`, `components/admin/AdminMentorApprovalWorkspace.tsx` | 관리자만 service role 경로로 검증값 입력 |

## 4. 미완 신호 목록

아래는 기능 공백으로 볼 만한 고신호 항목만 추린 것이다. 일반 placeholder 텍스트, 입력 placeholder, 정상 empty state는 제외했다.

| 위치 | 신호 | 해석 |
|---|---|---|
| `lib/auth/routeGuard.ts:41-55` | `profile`이 null이어도 student/mentor는 반환 | P1. 가입/프로필 row 누락 계정의 role guard 구멍 가능성 |
| `app/api/toss/webhook/route.ts:73` | `console.error(..., { orderId, data })` | P1. `data.paymentKey` 등 결제 payload가 서버 로그에 찍힐 수 있음 |
| `lib/mentor/mentorPayoutAccountActions.ts:27-28` | 계좌 컬럼 없으면 준비 중 반환 | 정산 계좌 저장 기능 미완 또는 스키마 의존 |
| `lib/admin/adminDisputeActions.ts:205` | 운영 메모 저장 필드 없음 | 관리자 분쟁 처리 메모 영속화 미완 |
| `components/admin/AdminActionPlaceholders.tsx:42-44` | 검색/기간 필터 disabled | 관리자 목록 필터 일부 미완 |
| `components/auth/SocialAuthButtons.tsx:104-122` | Google/Kakao/Naver 로그인 준비 중 | 소셜 로그인 미구현 |
| `components/cash/CashChargeWidget.tsx` | 카드 외 결제수단 준비 중 | 충전 수단 일부 미구현 |
| `components/community/CommunityPostDetail.tsx:159` | 재생 준비 중 | 커뮤니티 영상 재생/플레이어 미완 |
| `components/community/CommunityPostDetail.tsx:262` | 추천 데이터 준비 중 | 관련 추천 미완 |
| `components/customRequest/order/OrderProgressSection.tsx:410` | 파일 첨부 준비 중 | 맞춤의뢰 주문 채팅 첨부 미완 |
| `components/customRequest/MentorOrderFilesView.tsx:128` | 미리보기 준비 중 | 납품 파일 미리보기 미완 |
| `components/mentor/MentorProfileEditForm.tsx:500-512` | 대표 콘텐츠 연결 기능 준비 중 | 멘토 프로필 대표 콘텐츠 연결 미완 |
| `app/(student)/support/reports/page.tsx` | 신고 목록 API 미연결 안내 | 학생 신고 목록 조회 미완 |
| `supabase/sql` 번호 | `002`, `032`, `033`, `034`, `039`, `053`, `073` 중복 | P2. SQL 적용 순서/운영 문서 혼동 위험 |

번호 중복 파일:

```text
002: 002_app_core_schema_draft.sql, 002_custom_request_orders_status.sql, 002_p0_subscriptions_questions_draft.sql
032: 032_p0_weekly_question_usage.sql, 032_p1_admin_content_reports.sql
033: 033_p1_admin_reviews_moderation.sql, 033_question_threads_topic.sql
034: 034_mentor_favorites.sql, 034_p1_admin_disputes_processing.sql
039: 039_p1_custom_request_compat.sql, 039_storage_buckets_private_audit.sql
053: 053_community_rls_legacy_select_cleanup.sql, 053b_shortform_posts_published_select_rls.sql
073: 073_fix_exposed_cash_debit.sql, 073b_drop_orphan_cash_debit.sql
```

## 5. 남은 작업 목록

| 항목 | 상태 | 위험도 | 돈/인증/RLS 영향 | 새 SQL 필요 | 권장 다음 단계 |
|---|---|---|---|---|---|
| B. 학교군/계열 분류표 관리자화 | 착수 전 | 높음 | 인증, 공개 읽기, 관리자 | 예 | 현재는 `lib/mentor/schoolVerificationConstants.ts` 상수 기반. 관리 테이블/관리자 UI/공개 RPC 조인 정책 설계 필요 |
| C. 학생 공개질문 작성 UI + 자격 저장 | 착수 전 | 높음 | 인증, 공개 질문, RLS | 예 | `individual_questions` 또는 별도 eligibility table에 학교군/계열 조건 저장 필요 |
| D. 멘토 claim 하드차단 | 착수 전 | 높음 | 인증, 070 RPC, escrow 상태 전환 | 예 | `claim_individual_question` RPC가 `mentor_school_verifications` approved 최신값과 질문 조건을 원자적으로 검사해야 함 |
| P1. `routeGuard` profile null | 착수 전 | 중간~높음 | 인증/권한 | 아니오 | `requireRole`에서 student/mentor도 `!profile`이면 profile 에러/재로그인/온보딩으로 차단 |
| P1. Toss webhook paymentKey 로그 | 일부 | 중간 | 결제 PII/logging | 아니오 | 콘솔 로그에서 raw `data` 제거, paymentKey는 DB recovery log에도 필요 최소/마스킹 검토 |
| P2. 첨부 magic byte 검증 | 착수 전/부분 | 중간 | 파일 보안/스토리지 | 아니오 | 확장자/MIME 외 실제 파일 시그니처 검사 추가. 개별질문/맞춤의뢰/학교서류 공통화 권장 |
| P2. SQL 번호 중복 정리 | 착수 전 | 낮음~중간 | 운영 적용 문서 | 아니오 | 기존 운영 적용 이력 보존 전제로 INDEX/README 정리 또는 다음 번호 규칙 문서화 |
| 정산 계좌 저장 | 부분 | 중간 | 정산 PII | 가능성 있음 | 실제 컬럼 존재 여부 확정 후 암호화/마스킹/관리자 열람 정책 포함해 구현 |
| 관리자 분쟁 운영 메모 | 부분 | 낮음~중간 | 관리자 운영 데이터 | 가능성 있음 | dispute note 컬럼 또는 별도 notes table 추가 |
| 맞춤의뢰 주문 채팅 첨부/파일 미리보기 | 부분 | 중간 | 스토리지/RLS | 아니오 가능 | 기존 납품 파일 storage helper 재사용 여부 검토 |
| 커뮤니티 영상 재생/추천/좋아요 | 부분 | 낮음~중간 | 커뮤니티 UX/RLS | 아니오 가능 | 반응 테이블/쿼리 연결 여부 확인 후 상세 UI 연결 |
| 소셜 로그인 | 착수 전 | 중간 | 인증 | 아니오 가능 | Supabase OAuth provider 설정, callback, role selection 흐름 필요 |
| 078 SQL staging 적용 확인 | 확인 필요 | 높음 | P0 PII 공개 차단 | 아니오(이미 SQL 파일 있음) | Supabase SQL Editor 적용 후 anon으로 v2 응답 및 legacy grant revoke 확인 |

## 6. 런타임 점검 필요 목록

정적 분석만으로는 아래 항목의 실제 동작을 확정할 수 없다.

| 항목 | 확인 내용 |
|---|---|
| 078 공개 멘토 RPC | staging에서 `mentor_directory_list_v2`, `mentor_user_public_v2`, `mentor_profiles_for_directory_v2` 적용 여부, anon 응답에 `birth_date`, `payout_account_number`, `student_id_image_url`, 동의 메타가 없는지 |
| 공개 멘토 화면 | 인증 멘토의 `verified_*`, `school_tier`, `verified_major_category`가 카드/상세/필터에 반영되는지 |
| 구독 checkout | 캐시 차감, subscription/payment/room 생성, idempotency, quota 초기화 |
| 구독 갱신 cron | 주기 실행, 실패 재시도, ledger 중복 방지 |
| 질문방 | thread 생성, mentor answer, student confirm/wrong-answer, connection note 권한 |
| Toss 결제 | confirm/webhook 서명 검증, 중복 webhook, 실패 recovery log |
| 맞춤의뢰 escrow | 주문 수락 hold, 납품, 수정요청, 수락 release, 분쟁 split/refund, 중복 클릭 |
| 개별질문 escrow | 직접/공개 질문 hold, claim 경쟁, 답변 확정 release, 만료 환불 cron |
| Storage | 학생증/학교서류/개별질문/맞춤의뢰 첨부 signed URL, 비인가 접근 차단, 한글/특수문자 파일명 |
| 관리자 service role 경로 | admin guard 이후에만 service role update가 실행되는지, 비관리자 접근 실패 |
| 정산 | 멘토별 payout summary/monthly/detail의 실제 데이터와 원장 합계 일치 |

