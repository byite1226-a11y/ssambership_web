# SCREEN_INVENTORY — ssambership_web 레포 전체 감사 (읽기 전용)

> 작성일: 2026-06-11 · 방식: **읽기 전용 정적 분석**(코드 미수정, dev/빌드/마이그레이션 미실행)
> 대상 레포: `D:\dev\ssambership_web` (Next.js 16 App Router)
> 판정 기준: `없음` / `뼈대`(placeholder·TODO) / `부분`(핵심 UI는 있으나 일부 섹션·상태·연결 누락) / `완성`(UI+데이터+주요 상태)

---

## 1. 레포 개요

- **스택**: Next.js **16.2.4** (App Router, Server Actions), React **19.2.4**, TypeScript 5, Tailwind **v4**(@tailwindcss/postcss).
- **데이터/인증**: Supabase (`@supabase/ssr` 0.10, `supabase-js` 2.104) — `lib/supabase/server.ts` 기반 SSR 클라이언트 + RLS. 결제: Toss SDK(`@tosspayments/tosspayments-sdk` 2.7). 차트 recharts, 엑셀 xlsx, 상태 zustand, 데이터 @tanstack/react-query.
- **라우트 그룹**: `app/(public)`, `app/(student)`, `app/(mentor)`, `app/(admin)/admin/(console)` + 비그룹 `app/login`, `app/signup`, `app/logout`, `app/api/*`. **역할 가드**는 `lib/auth/routeGuard.ts`의 `requireRole(...)`로 페이지 진입 시 강제.
- **아키텍처 패턴**: `page.tsx`는 **얇은 래퍼** — `lib/<domain>/*Service|*Queries`로 데이터 로드 → `components/<domain>/<...>View` 렌더. 따라서 **완성도는 page 줄 수가 아니라 컴포넌트에 있음**. 5~14줄짜리 page 다수는 `redirect()`/`permanentRedirect()` **별칭**(레거시 URL 흡수)임.
- **도메인 폴더**: `lib/` 25개 도메인(admin·auth·cash·community·customRequest·qna·subscribe·reviews·mentor·disputes·notifications·toss …), `components/` 동일 도메인 + `customRequest`(45개), `community`(33), `mentor`(27), `admin`(19).
- **DB**: `supabase/sql/` SQL **66파일**(번호 001–059, 일부 번호 중복), 정본 인덱스 `supabase/sql/INDEX.md` 존재. 에스크로(054–057)·RLS 강화(027–029, 036)·스토리지 버킷(010/012/049/059) 포함.

---

## 2. 화면 상태표

> 범례: 🔁 = redirect/alias 페이지(화면 아님). 경로는 모두 `app/` 기준.

### 2-1. 공개·인증·멘토 탐색·구독 (8)

| 코드 | 화면 | 상태 | 실제 파일 | 비고 |
|---|---|---|---|---|
| PUB-01 | 메인 랜딩(비로그인) | **완성** | `app/page.tsx` → `components/landing/HomeLanding.tsx` → `PublicGuestLanding.tsx`(261L) | hero·stats·features·pricing·CTA 전부 렌더. |
| PUB-02 | 메인 랜딩(로그인) | **완성** | `app/page.tsx`(역할 분기) | 별도 로그인 홈 없음 — 루트가 학생/멘토별 CTA 분기. `(student)/home`은 `/mypage`로 🔁. |
| AUTH-01 | 로그인 | **완성** | `app/login/page.tsx` + `login/student`,`login/mentor` + `components/auth/LoginDualRolePanel.tsx`(152L) | 역할 듀얼카드 + 이메일/PW + 소셜버튼. |
| AUTH-02 | 회원가입/역할선택 | **완성** | `app/signup/page.tsx`(834L) + `components/auth/{RoleSelector,StudentSignupForm,MentorSignupForm}` | 3-step 위저드, 멘토 학생증 업로드, 약관 동의, Supabase auth 연동. |
| MENTOR-03 | 멘토찾기(비로그인) | **완성** | `app/(public)/mentors/page.tsx` + `components/mentor/MentorsListBody.tsx`(152L) | 단일 페이지가 양 상태 처리. 검색·필터·정렬·페이지네이션, 게스트는 찜=로그인 유도. |
| MENTOR-02 | 멘토찾기(로그인) | **완성** | 위와 동일(`favoriteIds`+`isLoggedIn` 주입) | 찜 토글 활성(`/api/mentors/favorites`). |
| MENTOR-01 | 멘토 상세 | **완성** | `app/(public)/mentors/[mentorId]/page.tsx` + `components/mentor/PublicMentorDetailBody.tsx`(308L) | 헤더·통계·과목탭·콘텐츠/리뷰 캐러셀·구독 사이드바·404/not_mentor 상태. 응답시간은 §5 참고(표시 stub). |
| SUB-01 | 구독 요금제 선택 | **완성** | `app/(student)/subscribe/page.tsx` + `success`/`fail`/`cancelled` + `components/subscribe/SubscribeCheckoutClient.tsx`(178L) | 플랜카드·cap 마감 비활성·캐시 검증. |

### 2-2. 질문방 (3)

| 코드 | 화면 | 상태 | 실제 파일 | 비고 |
|---|---|---|---|---|
| Q-01 | 질문방 학생용 | **완성** | `(student)/question-room/page.tsx`(→첫방 redirect)·`[roomId]`·`[roomId]/thread/[threadId]` + `components/qna/QuestionRoomWorkspace.tsx`(544L) | 방 목록·스레드·채팅·주간 사용량 바·접근제어. `(student)/questions*`는 🔁. |
| Q-02 | 질문방 멘토용(목록) | **완성** | `(mentor)/mentor/question-room/page.tsx`(→첫방)·`[roomId]` + `MentorQuestionRoomDashboard` | `(mentor)/questions*`는 🔁. |
| Q-03 | 질문방 멘토용(답변작성) | **완성** | `(mentor)/mentor/question-room/[roomId]/thread/[threadId]/page.tsx`(128L) | 동일 워크스페이스 mentor variant, 채팅 패널 활성, 답변 폼. |

### 2-3. 커뮤니티 (7)

| 코드 | 화면 | 상태 | 실제 파일 | 비고 |
|---|---|---|---|---|
| COM-01 | 커뮤니티 홈(게시판중심) | **완성** | `(public)/community/page.tsx` + `components/community/CommunityHomeSections.tsx` | 숏폼/게시판 각 5건 로드, 에러/빈 처리. |
| COM-02 | 커뮤니티 홈(혼합형) | **완성** | 동일 라우트/컴포넌트 | 단일 라우트로 통합(혼합 레이아웃). |
| COM-03 | 숏폼 목록 | **완성** | `community/shortform/page.tsx` + `CommunityShortformTabs/CategoryTabs/VideoCard` | 정렬·카테고리·그리드·업로드 FAB. |
| COM-04 | 게시글/숏폼 작성통합 | **부분** | `community/new/page.tsx` + `CommunityBoardComposeForm` | 게시판 작성만. 숏폼 작성은 `shortform/new`로 분리(통합 아님). |
| COM-05 | 숏폼 업로드 | **완성** | `community/shortform/new/page.tsx` + `CommunityShortformComposeForm` | 멘토 전용, mp4/mov/webm·500MB·3분 검증, `submitShortformUploadAction`, 임시저장. |
| COM-06 | 숏폼 상세 | **부분** | `community/shortform/[id]/page.tsx` + `CommunityShortformDetailView` | 영상 재생·댓글 작성 OK. **공유=비활성("준비 중"), 반응 토글·신고 UI 없음(읽기전용)**. |
| COM-07 | 게시판 상세 | **완성** | `community/board/[id]/page.tsx` + `CommunityBoardDetail` | 댓글(대댓글)·좋아요/스크랩·신고 액션 모두 연결. 팔로우 버튼만 비활성("준비 중"). |
| — | (부속) 게시판 홈 / 내 활동 | **완성** | `community/board/page.tsx`(무한스크롤), `community/me/page.tsx`(탭 5종) | — |
| — | 별칭 | 🔁 | `community/posts→board`, `shorts→shortform`, `shorts/[id]→shortform/[id]`, `write→new`, `(mentor)/mentor/community/new` | permanentRedirect/분기. |

### 2-4. 캐시결제·정산 (4)

| 코드 | 화면 | 상태 | 실제 파일 | 비고 |
|---|---|---|---|---|
| WAL-01 | 캐시 충전 | **완성** | `(student)/wallet/charge/page.tsx`+`success`+`fail` + `components/cash/CashChargeWidget.tsx`(214L) | Toss SDK `requestPayment`→`/api/toss/confirm`+webhook→`recordCashTopup`. 간편/무통장=준비중. `wallet/page`,`cash-history`,`(public)/cash`는 🔁/별칭. |
| WAL-02 | 사용내역/원장 | **완성** | `wallet/ledger/page.tsx` + `WalletLedgerPageBody.tsx`(332L) | 기간·유형 필터, 15건/페이지 페이지네이션, 빈 상태. |
| PAY-02 | 정산 요약 | **완성** | `(mentor)/mentor/payouts/page.tsx` + `components/mentor/payouts/MentorPayoutsMain.tsx`(157L) | 예상정산·스케줄·정산/수행 탭·월선택·엑셀 내보내기. |
| PAY-01 | 멘토 정산 상세 | **완성** | `mentor/payouts/detail/page.tsx` + `MentorPayoutsDetailView.tsx`(180L) + `app/api/mentor/payouts/detail` | 월·유형 필터, API 연동, 합계행, 엑셀. |

### 2-5. 마이페이지·멘토 프로필 (3)

| 코드 | 화면 | 상태 | 실제 파일 | 비고 |
|---|---|---|---|---|
| MY-01 | 마이페이지 학생용 | **완성** | `(student)/mypage/page.tsx`(183L) + `components/mypage/StudentDashboardShell` | 캐시잔액·최근5건·활성구독·질문방 카운트. |
| MY-02 | 마이페이지 멘토용 | **완성** | `(mentor)/mentor/mypage/page.tsx`(481L) | 수익카드(5개월 차트)·진행중 의뢰·구독학생/평점/cap 통계. KPI fallback 처리. |
| MENTOR-04 | 멘토 프로필 관리 | **완성** | `mentor/profile/edit/page.tsx` + `MentorProfileEditForm.tsx`(458L), 조회 `mentor/profile/page.tsx`(192L) | 6섹션 폼·실시간 미리보기·`submitMentorProfileEdit`. **대표 콘텐츠 추가 버튼=비활성("준비 중")**. |

### 2-6. 맞춤의뢰 — 학생측 (CRS, 8)

| 코드 | 화면 | 상태 | 실제 파일 | 비고 |
|---|---|---|---|---|
| CRS-01 | 메인/소개 | **완성** | `(public)/custom-request/page.tsx` + Hero/Steps/CategoryGrid/PostListTable | 역할별 CTA 분기. |
| CRS-02 | 의뢰 요청 등록 | **완성** | `(student)/custom-request/new/page.tsx` + `CustomRequestNewForm` | 4-step 스테퍼, 첨부 최대5, 예산/마감, 정책 동의. 내 의뢰 목록 `custom-request/posts/page.tsx`도 완성. |
| CRS-03 | 요청 정보 확인 | **부분** | `new` 흐름 Step4 | 정책·외부연락금지 동의 체크박스만. **입력 내용 요약/검토 UI는 미약**(폼 제출 직행). |
| CRS-04 | 멘토 지원 대기 | **완성** | `[postId]/applications/waiting/page.tsx` + `CustomRequestApplicationsWaitingView` | 지원자 카드·마감 카운트다운. |
| CRS-05 | 멘토 선택(비교표) | **완성** | `[postId]/applications/page.tsx` + `ApplicationsCompareView` | 비교표·`SelectMentorApplicationForm`·첨부 라이트박스(§5). |
| CRS-06 | 주문방/납품 | **완성** | `(public)/custom-request/orders/[orderId]/page.tsx` + `components/customRequest/order/*` | 공통 OrderRoom 상태머신(메시지·납품·수정·분쟁·이벤트로그). 상태 분기 §하단. |
| CRS-07 | 납품 확인/검토 | **완성** | `orders/[orderId]/review/page.tsx` + `CustomRequestOrderReviewPanel` | 다운로드·수락·수정요청·분쟁 폼. |
| CRS-09 | 주문 완료 | **완성** | `(student)/custom-request/orders/[orderId]/complete/page.tsx`(194L) | 최종금액·결제내역·리뷰 유도. |

**OrderRoom 상태머신 커버 상태**: `pending`(학생 취소) → `confirmed`(멘토 작업시작) → `in_progress`(납품) → `delivered`(수락/수정요청/분쟁) → `completed`(이력+다운로드만). active 분쟁 시 납품/수락/수정 액션 차단.

### 2-7. 맞춤의뢰 — 멘토측 (CRM)

| 코드 | 화면 | 상태 | 실제 파일 | 비고 |
|---|---|---|---|---|
| CRM-01 | 대시보드 | **완성** | `(mentor)/mentor/custom-request/dashboard/page.tsx` + `MentorCustomRequestDashboardView` | KPI·진행중 의뢰·수익. `custom-request/page.tsx`는 🔁. |
| CRM-02 | 새 의뢰 목록 | **완성** | `custom-request/posts/page.tsx` + `MentorOpenPostListSection` | 카테고리 탭·카운트. |
| CRM-03 | 의뢰 상세 확인 | **완성** | `posts/[postId]/page.tsx` + `MentorCustomRequestDetailCard` | 미지원/지원완료/마감 상태 분기. |
| CRM-04 | 제안서 작성 | **완성** | `posts/[postId]/apply/page.tsx` + `MentorApplicationForm` | 가격·납기·제안내용·첨부(최대3), `submitMentorCustomRequestApplication`. |
| CRM-05 | 제안 완료 | **부분** | `posts/[postId]?submitted=1` 배너 | **전용 페이지 없음** — 상세 페이지에 성공 배너만. |
| CRM-06 | 수락된 의뢰 | **완성** | `orders/page.tsx` + `MentorCustomRequestOrdersBrowseClient` | 탭(전체/결제/작업/납품/완료) 필터. |
| CRM-19 | 작업방 | **완성**(🔁) | `orders/[orderId]/page.tsx`·`/room` → `(public)/custom-request/orders/[orderId]` | 공통 OrderRoom의 mentor 뷰. |
| CRM-20 | 작업 파일 | **완성** | `orders/[orderId]/files/page.tsx` + `MentorOrderFilesView` | 업로드/다운로드·스테퍼·`uploadMentorOrderWorkFileAction`·`markMentorOrderDeliveredForReviewAction`. |
| CRM-21 | 납품 대기 | **완성** | `orders/[orderId]/waiting-review/page.tsx` + `MentorOrderWaitingReviewView` | 검토 대기·카운트다운. |
| CRM-22 | 수정 요청 대응 | **완성** | `orders/[orderId]/revision/page.tsx` + `MentorOrderRevisionView` | 수정 메시지·버전·횟수 카운터. |
| CRM-24 | 종료된 의뢰 | **완성**(필터) | `orders/page.tsx?tab=done` | 전용 페이지 없이 탭 필터(`classifyMentorOrderBrowseTab`). |

> CRM-07~18·23 등 기획서상 일부 세부 상태코드는 위 상태머신/탭에 흡수됨(별도 라우트 아님).

### 2-8. 관리자 백오피스 (9)

| 코드 | 화면 | 상태 | 실제 파일 | 비고 |
|---|---|---|---|---|
| ADM-01 | 대시보드 | **완성** | `(admin)/admin/(console)/dashboard/page.tsx` + `AdminDashboardView` | 추이/파이 차트·최근 이슈·바로가기. |
| ADM-02 | 시스템 설정 | **뼈대** | `(console)/settings/page.tsx`(13L) | **placeholder만**("추후 이 화면에서 설정"). 폼·데이터·액션 없음. |
| ADM-03 | 이벤트/공지 관리 | **부분** | `(console)/notices/page.tsx` + `AdminNoticesList`/`AdminNoticesFormSkeleton` | 목록·폼 스켈레톤. **작성 폼 제출 액션 바인딩 미확인**(확인 필요). 액션 파일 `adminNoticesActions.ts` 존재. |
| ADM-04 | 환불/정산 관리 | **완성** | `refunds/page.tsx`(320L)+`refunds/[id]`+`settlements/page.tsx`(173L) | 승인/거절(`approve/rejectAdminRefundAction`). 정산표는 읽기전용(수동 지급 UI 없음). `refunds-settlement`는 🔁. |
| ADM-05 | 신고/분쟁 관리 | **완성** | `disputes/page.tsx`+`disputes/[id]`(119L) | 필터·제재(`applyDisputeSanctionAction`)·상태변경·에스크로 분배(`recordDisputeEscrowSplitAction`). |
| ADM-06 | 리뷰 관리 | **완성** | `reviews/page.tsx`(94L)+`reviews/[reviewId]` + `AdminReviewsTable` | hide/restore/blind (`moderateAdminReviewAction`). |
| ADM-07 | 콘텐츠 검수 | **완성** | `moderation/page.tsx` + `AdminModerationWorkspace`/`AdminContentReportsTable` | 상태변경·모더레이션(`updateContentReportStatus/ModerationAction`). `reports→moderation` 🔁. |
| ADM-08 | 활동 로그 | **완성** | `audit-logs/page.tsx` + `AdminUnifiedActivityLogView` | 통합 로그 최근 50건. 날짜 검색/필터는 미구현(향후). |
| ADM-09 | 멘토 승인 관리 | **완성** | `mentor-approval/page.tsx` + `mentor-approvals/[id]`(108L) | 승인/거절/서류요청·cap 한도(`approve/reject/requestMentorDocumentsAction`,`updateMentorCapLimitAction`). `mentors`,`mentor-approvals`(목록)은 🔁. |
| — | 관리자 로그인 | **완성** | `(admin)/admin/login/page.tsx`(81L) | `adminEmailLoginAction`, 콘솔 layout에서 `requireRole("admin")`. |

---

## 3. 도메인 상태표 (테이블 / RLS / 서버액션·서비스)

> 근거: `supabase/sql/INDEX.md`(001–059) + `lib/<domain>` 액션 파일. ✅=충분 △=부분/우회 ❌=없음

| # | 도메인 | 핵심 테이블 | (a)테이블 | (b)RLS | (c)액션/서비스 |
|---|---|---|---|---|---|
| 1 | 계정·권한 | `users`,`mentor_profiles`,멘토검증 | ✅ 001 (`users`,`mentor_profiles`); 검증은 `verification_logs`(035)·멘토 cap(050) | ✅ 001 RLS + 035 SELECT 정책 | ✅ `mentorApprovalActions`,`mentorProfileEditActions`,`mentorCapAdminActions`,`getServerUserWithProfile` |
| 2 | 구독·질문방 | `plans`,`subscriptions`,`subscription_usage_counters`,`mentor_student_rooms`,`question_threads/messages`,`connection_notes` | ✅ 002_p0(구독·방·질문)·033(topic)·048(notes author); 사용량 032(weekly)·044/046/052(free); **`plans`는 코드 카탈로그**(`SUBSCRIBE_PLAN_CATALOG`)+004 멘토플랜 | ✅ 026/027/028/029(구독·결제·방 잠금·강화) | ✅ `subscribeCheckoutService`,`mentorCapService`,`questionRoomActions/ThreadService`,`weeklyQuestionUsageServer` |
| 3 | 커뮤니티 | `shortform_posts`,`community_posts`,`comments`,`reactions`,`reports` | ✅ 016(comments)·037(board v2: reactions/hashtags)·038(shortform v2)·032_p1(`content_reports`) | ✅ 017·053·053b(공개 SELECT 정리) | ✅ `community{Board,Compose,Shortform,Comment,Report,Hero}Actions` |
| 4 | 캐시·결제 | `cash_wallets`,`cash_ledger`,`payments`,`refunds` | ✅ 004(지갑/원장)·019/020(RPC)·021(refunds) | ✅ 023/024/025/030(서버전용 GRANT, refund admin RPC) | ✅ `walletTopupActions`,`toss/confirm·webhook`,`refundActions` |
| 5 | 맞춤의뢰 | `custom_request_posts/applications/orders`,`custom_order_messages/deliverables/revisions`,`disputes` | ✅ 003(코어)·007(revisions/events)·008/009(disputes)·010/012/059(스토리지)·013/014/043(정산)·054–057(에스크로) | ✅ 007/008/015/047(분쟁 중 정산 차단 트리거) | ✅ `customRequest*`,`order*`(Message/Deliverable/Revision/Dispute/Settlement/Escrow) 다수 |
| 6 | 운영·정산 | `reviews`,`payouts`,`notices`,`promotions`,`notifications`,`admin_action_logs` | ✅ 042/045(reviews)·031(`app_notices`/promotions)·040(`admin_action_logs`)·002_p0(notifications); **payouts는 `custom_order_settlement_items`(013)+`cash_ledger` 합산**(전용 payouts 테이블 △)·041(정산계좌) | ✅ 021/030/033/036/047 등 | ✅ `mentorPayoutsService`,`adminNoticesActions`,`adminActionLog`,`notificationReadActions`,`adminReviewActions` |

---

## 4. 불일치 목록 (화면 ↔ 백엔드 미스매치)

1. **납품물 보호(거래 완료 전 다운로드 차단) — 백엔드 가드 부재.** `downloadCustomOrderDeliverableAction`은 주문 당사자/role(canAccessOrder)만 검증하고 **주문 상태(escrow/완료)를 게이트하지 않음**. 즉 학생이 결제/수락 전이라도 당사자면 납품 파일 다운로드 가능. UI 기대(보호)와 액션 구현 불일치. → **보안성 갭(P0/P1 후보).**
2. **외부 연락처 차단 필터 — UI 안내만, 백엔드 규칙 없음.** `ContactMaskingNotice`가 "키워드 탐지·마스킹은 백엔드 규칙 준비되는 대로 연결"이라고 명시. 실제 마스킹/필터 코드 없음(메시지·지원서·의뢰 본문 어디에도). → 화면(경고 배너) 존재 ↔ 백엔드 미구현.
3. **멘토 평균 응답시간 — 표시 stub, 산출 백엔드 없음.** `formatAvgResponseHoursLabel`이 `mentor_profiles.avg_response_hours` 컬럼을 12시간 버킷으로 표시(없으면 "12시간 이내" 기본). 그러나 **해당 컬럼을 채우는 마이그레이션/집계/writer가 레포에 없음**(`avg_response_hours`는 표시 헬퍼에서만 참조). → 멘토 상세에 값 노출 ↔ 실데이터 산출 없음.
4. **숏폼 반응/신고 — 백엔드 액션은 있으나 UI 미연결.** 게시판은 좋아요/스크랩/신고가 모두 연결됨(037+actions). 숏폼 상세는 카운트 **읽기전용**(토글·신고 UI 없음). → 백엔드(reactions/report) ↔ 숏폼 화면 미스매치.
5. **ADM-02 시스템 설정 — 화면 뼈대 + 백엔드 설정 테이블 없음.** placeholder 페이지만 존재, 대응 settings/config 테이블·액션 없음. (양쪽 부재 → 통째 미착수 구간)
6. **에스크로 정산 — 백엔드(RPC 054–057) > UI.** 에스크로 hold/payout/refund/split RPC는 완비돼 있으나 OrderRoom 정산 블록은 **상태 텍스트 안내 위주**(정산액 계산·타임라인 상세 UI 약함). → 백엔드가 화면보다 앞섬.
7. **post 첨부(학생 참고자료) — 다운로드만, 미리보기 없음.** 멘토 지원서 첨부는 미리보기(라이트박스)까지 있으나, 의뢰 등록 첨부는 `downloadCustomRequestPostAttachmentAction`만 존재. (§5-3)

---

## 5. 진행 중 항목 상태 (4장)

### 5-1. 맞춤의뢰 지원서 첨부 미리보기(썸네일+라이트박스+PDF 새 탭) — ✅ 구현됨
- `components/customRequest/ApplicationAttachmentFileListClient.tsx` 존재. 이미지 썸네일(`thumbUrlByAttachmentId`) → 클릭 시 `ApplicationAttachmentLightbox` 라이트박스, URL은 `getApplicationAttachmentPreviewUrlAction`로 서명 발급. `isPreviewableImageMime`로 이미지만 라이트박스, 그 외(PDF 등)는 `CustomRequestApplicationFileChip`가 처리.
- `getApplicationAttachmentPreviewUrlAction` **존재**(`lib/customRequest/applicationAttachmentDownloadActions.ts`).

### 5-2. 맞춤의뢰 지원서 첨부 다운로드 버튼/액션 — ⚠️ try/catch redirect 버그 **여전히 존재**, 화면 연결됨
- `downloadCustomRequestApplicationAttachmentAction`(동 파일 L30~44): `try { const {url}=...; redirect(url); } catch(err){ handleAccessError(...) }` 구조. **`redirect()`가 던지는 `NEXT_REDIRECT`를 catch가 잡아** `handleAccessError`(L19) → `ApplicationAttachmentAccessError`가 아니므로 `back()`(L15)에서 **에러 페이지로 재-redirect**. 즉 정상 다운로드 성공이 에러 redirect로 덮임. (해결책: 성공 `redirect(url)`를 try **밖**으로, 또는 `isRedirectError` 재-throw.)
- 화면 연결: `CustomRequestApplicationFileChip.tsx`가 이 액션을 폼 action으로 사용 → **버그가 라이브로 연결됨.**
- 대조군(정상): `downloadCustomOrderDeliverableAction`·`downloadCustomRequestPostAttachmentAction`는 `redirect()`를 try 밖 말미에서 호출 → 버그 없음. **버그는 지원서 첨부 액션 한정.**

### 5-3. post 첨부(학생 참고자료) 미리보기 확장 — ❌ 미확장(다운로드 전용)
- `getPostAttachmentPreviewUrlAction`·`PostAttachmentLightbox`·`PostAttachmentFileListClient` **전부 없음**. `downloadCustomRequestPostAttachmentAction`만 존재. 지원서 첨부와 달리 미리보기 미적용.

### 5-4. 응답시간 / 외부연락 차단 / 납품물 보호 — 대부분 미구현(§4와 동일)
- **평균 응답시간**: 표시 헬퍼만(`avgResponseHoursDisplay.ts`), 산출 백엔드 없음 → △(stub).
- **외부연락처 차단 필터**: `ContactMaskingNotice` 배너만, 키워드 탐지/마스킹 코드 없음(주석에 "백엔드 준비되는 대로" 명시) → ❌.
- **납품물 보호(완료 전 차단)**: 다운로드 액션이 주문 상태를 게이트하지 않음 → ❌(보안 갭). 단, 멘토 **업로드** 폼은 상태로 게이트됨.

---

## 6. 한 줄 총평

> 화면 골격·데이터 연결은 **압도적으로 완성**(58개 중 대부분 완성, 다수 레거시 URL은 redirect 별칭으로 정리됨). **지금 가장 비어 있는 구간은 P0 신뢰·안전 정책 3종 — ① 납품물 완료-전 다운로드 차단(백엔드 가드 부재), ② 외부연락처 키워드 탐지/마스킹(배너만), ③ 지원서 첨부 다운로드 액션의 try/catch redirect 버그(라이브)** 이며, 그다음이 P1~P2의 **ADM-02 시스템 설정(뼈대)·숏폼 반응/신고 UI·평균 응답시간 산출·post 첨부 미리보기**다.
