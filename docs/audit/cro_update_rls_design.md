# custom_request_orders update RLS 축소 설계 조사 (M-1)

## 0. 범위와 결론

- 조사 범위: `public.custom_request_orders` update RLS, 앱 코드의 직접 update 경로, 맞춤의뢰 상태/결제/정산 RPC 경로.
- 변경 범위: 없음. 이 문서는 설계 산출물이며 코드/SQL 실행/커밋은 하지 않는다.
- 결론: 현재 `cro_update`는 학생/멘토/legacy 당사자/관리자면 모든 칼럼 update를 허용한다. 코드에서 당사자가 정당하게 직접 바꾸는 칼럼은 비민감 메모류가 아니라 상태 전이/타임스탬프뿐이다. 따라서 권장안은 `authenticated`의 `custom_request_orders` UPDATE 권한과 `cro_update` 정책을 제거하고, 멘토 시작/납품/학생 수정요청 같은 정상 상태 전이는 SECURITY DEFINER RPC 또는 service_role 서버 경로로 옮기는 것이다.
- 적용 전 필수 코드 전환: `orderMentorActions.ts`, `orderRevisionActions.ts`, `orderStatusColumnPatch.ts`의 직접 update 경로를 RPC로 옮겨야 한다. 이 전환 없이 정책을 제거하면 정상 UI가 깨진다.

## 1. 현재 update RLS 정책 전문

### 1.1 출처

- 기본 정책: `supabase/sql/003_p0_custom_request_draft.sql:437-458`
- 이후 관련 이력: `supabase/sql/036_p1_prelaunch_rls_tightening.sql:77-94`에 update tightening 후보가 주석으로만 남아 있다. 실제 drop/create는 주석 처리라 live 정책 변경은 없다.

### 1.2 현재 정책

```sql
drop policy if exists "cro_update" on public.custom_request_orders;
create policy "cro_update" on public.custom_request_orders
  for update to authenticated
  using (
    student_id = (select auth.uid())
    or buyer_id = (select auth.uid())
    or client_id = (select auth.uid())
    or user_id = (select auth.uid())
    or author_id = (select auth.uid())
    or requester_id = (select auth.uid())
    or mentor_id = (select auth.uid())
    or (select public.is_admin()) = true
  )
  with check (
    student_id = (select auth.uid())
    or buyer_id = (select auth.uid())
    or client_id = (select auth.uid())
    or user_id = (select auth.uid())
    or author_id = (select auth.uid())
    or requester_id = (select auth.uid())
    or mentor_id = (select auth.uid())
    or (select public.is_admin()) = true
  );
```

### 1.3 판단

- `USING`/`WITH CHECK` 모두 당사자성만 검사한다.
- 상태, 금액, 결제상태, 정산/분쟁 관련 칼럼 고정 조건이 없다.
- 따라서 인증 클라이언트가 `custom_request_orders`를 직접 update할 수 있는 코드/버그/콘솔 경로를 얻으면, 서버 액션/RPC의 상태머신 검증을 우회할 수 있다.

## 2. 코드의 직접 update 경로와 칼럼

### 2.1 직접 update 경로

| 파일 | 경로 | 현재 update 칼럼 | 성격 | 좁히면 영향 |
|---|---|---|---|---|
| `lib/customRequest/orderMentorActions.ts:123-135` | 멘토 작업 시작 | primary status 컬럼(`status/state/order_status/stage` 중 실제 row의 첫 상태 칼럼) = `open`, `started_at/work_started_at/in_progress_at/mentor_started_at` 중 존재 칼럼, `updated_at`은 trigger | 상태 전이 | RPC 전환 필요 |
| `lib/customRequest/orderMentorActions.ts:396-410` | 멘토 납품 확정/검토대기 | helper로 `order_status='delivered'` + 직접 primary status = `delivered` | 상태 전이 | RPC 전환 필요 |
| `lib/customRequest/orderMentorActions.ts:628-642` | 멘토 납품 제출 | helper로 `order_status='delivered'` + 직접 primary status = `delivered` | 상태 전이 | RPC 전환 필요 |
| `lib/customRequest/orderRevisionActions.ts:127-134` | 학생 수정요청 | `orderStatusColumnPatch` helper로 `order_status='revision_requested'`, 기존 `order_status='delivered'` 조건 | 상태 전이 | RPC 전환 필요 |
| `lib/customRequest/orderStatusColumnPatch.ts:23-33` | 공통 상태 패치 helper | `order_status`, `updated_at` | 상태 전이 | 호출부 RPC 전환 또는 helper 폐기 필요 |

### 2.2 직접 update처럼 보였으나 당사자 RLS와 무관한 경로

| 파일/SQL | 경로 | 칼럼 | 이유 |
|---|---|---|---|
| `lib/customRequest/customOrderEscrowService.ts:88-102` | 주문 생성 후 예치 성공 표시 | `payment_status='escrowed'`, `updated_at` | `createServiceRoleClient()` service_role 경로라 authenticated RLS 축소 영향 없음 |
| `lib/customRequest/customOrderEscrowService.ts:115-125` | 예치 실패 시 unpaid 주문 삭제 | delete | service_role best-effort cleanup |
| `supabase/sql/043_p1_accept_order_settlement_atomic_rpc.sql` | 학생 납품 수락/정산 생성 | `status/state/order_status='completed'`, `accepted_at/completed_at/updated_at` | SECURITY DEFINER RPC |
| `supabase/sql/055_p0_custom_order_escrow_payout.sql` | 지급/수락 처리 | `payment_status='paid'`, 완료 상태/시각 | SECURITY DEFINER/service_role RPC |
| `supabase/sql/056_p0_custom_order_escrow_refund.sql` | 환불/학생 취소 | `payment_status='refunded'`, `status/state/order_status='cancelled'` | SECURITY DEFINER/service_role RPC |
| `supabase/sql/057_p0_custom_order_dispute_split.sql` | 분쟁 분배 | `payment_status/status/state/order_status='dispute_resolved'` | SECURITY DEFINER/service_role RPC |
| `supabase/sql/030_p0_refund_approve_reject_admin_rpc.sql` | 관리자 환불 승인 | `payment_status='refunded'` | admin RPC |

### 2.3 코드상 직접 update가 아닌 것

- `lib/customRequest/customRequestMutations.ts:updateWithCandidates`는 `custom_request_posts` 수정용 helper다. 이름은 일반적이지만 `custom_request_orders` update 경로는 아니다.
- 관리자 목록/정산/대시보드 쪽 `custom_request_orders` 사용은 조회 위주다.

## 3. 칼럼 분류

### 3.1 잠가야 하는 칼럼 (RPC/service_role 전용)

| 분류 | 칼럼 |
|---|---|
| 당사자/FK 식별 | `student_id, mentor_id, buyer_id, client_id, user_id, author_id, requester_id, selected_mentor_id, assigned_mentor_id, expert_id` |
| 주문/신청 연결 | `post_id, custom_request_post_id, custom_request_id, request_id, application_id, custom_request_application_id, selected_application_id` |
| 상태머신 | `status, state, order_status, stage` |
| 결제/정산/환불/분쟁 | `payment_status` 및 향후 `payment_state/pay_status/refund/dispute/settlement` 계열이 추가될 경우 전부 |
| 금액 | `agreed_price, proposed_price, price, amount` |
| 상태 시각 | `started_at, work_started_at, in_progress_at, mentor_started_at, completed_at, accepted_at, closed_at, finished_at` |
| 시스템 시각 | `created_at, updated_at` (`updated_at`은 trigger/RPC가 관리) |

### 3.2 당사자 직접 update 허용 가능 칼럼

- 현재 스키마(`003`) 기준으로 없음.
- 메모, 읽음표시, 방 이벤트, 첨부/납품 기록은 별도 테이블(`order_events`, `custom_order_deliverables`, `custom_order_revisions`, `custom_order_message_attachments` 등)에 존재한다.
- 따라서 `custom_request_orders` 자체는 당사자가 직접 update할 이유가 없고, 상태 전이만 남아 있다.

## 4. 좁히기 방식 비교

### 4.1 후보 A: UPDATE 정책 제거/대폭 축소

내용:
- `authenticated`에서 `custom_request_orders` UPDATE 권한을 회수한다.
- `cro_update` 정책을 제거한다.
- 모든 상태/결제/금액/시각 변경은 SECURITY DEFINER RPC 또는 service_role 서버 액션으로만 수행한다.

장점:
- 가장 안전하다. 상태/금액/결제/분쟁 칼럼 직접 변조면이 사라진다.
- RLS가 칼럼 불변식을 표현하지 못하는 한계를 우회한다.
- 이미 완료/환불/분쟁/정산 주요 흐름은 RPC로 존재하므로 방향성이 코드 구조와 맞다.

단점/필수 전환:
- 현재 멘토 작업 시작, 멘토 납품 상태 전환, 학생 수정요청 상태 전환이 인증 클라이언트로 직접 update한다.
- 적용 전 해당 경로를 RPC로 전환하지 않으면 정상 UI가 막힌다.

### 4.2 후보 B: update 유지 + 민감 칼럼 고정

내용:
- 당사자 update 정책을 유지하되 일부 칼럼만 update 허용하거나, 민감 칼럼 old=new를 강제한다.

문제:
- PostgreSQL RLS 정책만으로 `OLD`/`NEW` 칼럼 비교를 깔끔하게 표현하기 어렵다. `WITH CHECK`는 새 row 중심이고, 칼럼별 불변식은 column privilege나 trigger가 필요하다.
- column-level `GRANT UPDATE(col...)`로 금액/FK를 막을 수는 있지만, 현재 정상 직접 update 칼럼 자체가 상태 칼럼이다. 상태 칼럼을 열면 임의 상태값 우회가 남는다.
- trigger로 전이 검증을 붙일 수 있으나, 사실상 RPC 상태머신을 DB trigger로 중복 구현하게 된다.

판정:
- 후보 B는 임시 완화책으로도 실익이 작다. 직접 허용 가능한 비민감 칼럼이 없으므로 후보 A가 권장안이다.

## 5. 권장안과 영향 코드

### 5.1 권장 적용 순서

1. `088` 또는 다음 적용 SQL에서 멘토/학생 상태 전이 RPC를 만든다.
   - 예: `custom_order_mark_work_started(p_order_id)`
   - 예: `custom_order_mark_delivered(p_order_id)`
   - 예: `custom_order_request_revision(p_order_id, p_note)` 또는 기존 revision insert + status update를 한 RPC로 묶기
2. 앱 코드 직접 update 경로를 위 RPC 호출로 변경한다.
3. 같은 SQL 또는 후속 SQL에서 `cro_update`를 drop하고 `authenticated` UPDATE 권한을 revoke한다.
4. 기존 select/insert 정책은 유지한다. `custom_request_orders` select 완화 금지.

### 5.2 영향받는 코드 경로

- `lib/customRequest/orderMentorActions.ts`
  - `startCustomOrderWorkAction`: 직접 update를 `custom_order_mark_work_started` RPC로 전환.
  - `markMentorOrderDeliveredForReviewAction` 및 `submitMentorOrderDeliverableAction`: `patchCustomOrderOrderStatus`와 직접 primary status update를 `custom_order_mark_delivered` RPC로 전환.
- `lib/customRequest/orderRevisionActions.ts`
  - `submitCustomOrderRevisionRequestAction`: revision row insert와 order_status 변경을 DB RPC로 묶거나, 최소한 order status 변경만 `custom_order_request_revision` RPC로 전환.
- `lib/customRequest/orderStatusColumnPatch.ts`
  - 호출부가 사라지면 제거 가능. 다른 호출이 남으면 RPC wrapper로 바꾸는 편이 안전.

## 6. 새 SQL 초안 (적용 금지)

다음은 lockdown만 담은 최소 초안이다. 실제 적용은 위 코드/RPC 전환과 같은 배치에서 해야 한다. 전환 없이 실행하면 멘토 시작/납품, 학생 수정요청이 깨진다.

파일명 후보: `supabase/sql/088_cro_update_rls_lockdown.sql`

```sql
-- =============================================================================
-- 088_cro_update_rls_lockdown.sql
-- Purpose: Narrow custom_request_orders update surface (M-1).
-- Scope:
--   - Remove broad party UPDATE policy on custom_request_orders.
--   - Revoke authenticated direct UPDATE privilege.
--   - Keep SELECT/INSERT policies unchanged.
--   - State/payment/amount/dispute/settlement changes must go through
--     SECURITY DEFINER RPCs or service_role server paths.
-- WARNING:
--   Apply only after direct authenticated update paths in orderMentorActions,
--   orderRevisionActions, and orderStatusColumnPatch are moved to RPCs.
-- =============================================================================

begin;

revoke update on table public.custom_request_orders from authenticated;

drop policy if exists "cro_update" on public.custom_request_orders;

comment on table public.custom_request_orders is
  'Custom request orders. Direct authenticated UPDATE is disabled; state/payment/amount transitions must use server-side RPC/service_role paths.';

commit;
```

RPC 포함 초안은 적용 단계에서 별도 작성하는 편이 안전하다. 이유는 현재 상태머신이 코드(`orderLifecycleConstants.ts`)와 여러 RPC(`043/055/056/057`)에 나뉘어 있어, 단순 RLS SQL만으로 전이 검증을 충분히 표현하기 어렵기 때문이다.

## 7. 회귀 위험과 미터치 확인

### 회귀 위험

- `cro_update` 제거를 먼저 적용하면 다음 정상 동작이 막힌다.
  - 멘토 작업 시작
  - 멘토 납품 제출 후 delivered 상태 표시
  - 학생 수정 요청 후 revision_requested 상태 표시
- 위 경로를 RPC로 먼저 옮긴 뒤 lockdown SQL을 적용해야 한다.

### 보안 리스크 감소

- 학생/멘토가 직접 금액(`agreed_price/amount`), 결제상태(`payment_status`), 완료/취소/분쟁 상태(`status/state/order_status/stage`), 당사자 FK를 바꾸는 우회면을 제거한다.
- 서버 RPC의 상태머신/예치/정산 검증을 우회하는 직접 테이블 update 경로가 닫힌다.

### 미터치 확인

- 에스크로(`054~057`), 환불(`030/068/069`), `070`, `077`은 이번 조사에서 변경하지 않는다.
- 기존 RLS 완화 없음. 권장 SQL은 update surface를 줄이는 방향이다.
- 기존 SQL 파일 수정 없음. 적용 시 새 번호(`088`)로만 추가한다.