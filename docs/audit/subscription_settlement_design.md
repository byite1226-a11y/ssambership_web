# 구독 정산 원장화 설계 조사 (재무 B-1)

범위: 조사 및 설계 초안. 코드, 실제 SQL 파일, DB 실행, 커밋 없음. 실제 멘토 송금 실행은 이번 범위 밖이다.

## 1. 구독 결제 -> 멘토 귀속 구조 + 원장 단위 판정

### 현재 귀속 구조

현재 코드/SQL 기준 구독은 `subscriptions` 한 행이 `student_id`와 `mentor_id`를 직접 가진다.

근거:

- `supabase/sql/002_p0_subscriptions_questions_draft.sql`
  - `subscriptions(id, student_id, mentor_id, payment_id, plan_tier, plan_id, status, ...)`
  - `unique index uq_subscriptions_pair on (student_id, mentor_id)`
  - `mentor_student_rooms.subscription_id -> subscriptions.id`
- `lib/subscribe/subscriptionsTable.ts`
  - `buildSubscriptionsInsertPayload()`가 `student_id`, `mentor_id`, `payment_id`, `plan_tier`, `plan_id`, `status=active`, 기간 필드를 함께 만든다.
- `lib/subscribe/subscribeCheckoutService.ts`
  - 체크아웃 완료 시 `insertSubscriptionRow()`가 특정 `studentId + mentorId + planTier` 조합으로 `subscriptions`를 생성한다.
  - 이후 `recordInitialSubscriptionBillingEvent()`가 같은 `subscription_id/student_id/mentor_id`로 `subscription_billing_events`를 남긴다.
  - 질문방은 `ensureMentorStudentRoom(..., subscriptionId)`로 같은 구독 행에 연결된다.
- `supabase/sql/064_subscription_billing_period_schema.sql`
  - `subscription_billing_events`는 `subscription_id`, `student_id`, `mentor_id`, `event_type`, `status`, `period_start`, `period_end`, `amount_cents`, `ledger_id`, `payment_id`를 가진 append-only 성격의 청구 이벤트다.
- `supabase/sql/068_subscription_renewal_rpc.sql`
  - 갱신 성공 시 같은 `subscription_id/student_id/mentor_id`로 `subscription_billing_events(status='succeeded', event_type='renewal')`를 만들고 학생 지갑 `cash_ledger` 차감 행을 연결한다.

### 여러 멘토 분산 여부

한 학생이 여러 멘토를 구독할 수는 있다. `uq_subscriptions_pair(student_id, mentor_id)`는 같은 학생-멘토 쌍의 중복만 막고, 학생 단독 unique는 없다.

하지만 현재 구조에서 **한 구독 결제/청구 이벤트 1건이 여러 멘토로 분산되는 흐름은 확인되지 않는다.** 각 구독 결제는 특정 `subscription_id` 하나에 묶이고, 그 subscription row가 단일 `mentor_id`를 가진다. 즉 분산은 “학생이 여러 멘토에게 각각 구독 row를 가진다”는 의미이지, “결제 1건의 70%를 여러 멘토에게 배분한다”는 구조가 아니다.

`050_mentor_subscription_cap.sql`의 cap도 멘토별 활성 구독 수요를 제한하는 구조다. `mentor_cap_used(p_mentor_id)`는 `subscriptions where mentor_id = p_mentor_id and status='active'`를 합산한다. 이것도 구독 row가 단일 멘토 귀속이라는 전제다.

### 현재 정산 화면 계산 방식

`lib/mentor/mentorPayoutsService.ts`의 `loadSubscriptionLines()`는 다음 순서로 구독 수익을 만든다.

1. `subscriptionIdsForMentor(client, mentorId)`가 `subscriptions.select('id').eq('mentor_id', mentorId)`로 해당 멘토의 subscription id 목록을 구한다.
2. `cash_ledger`에서 `reason='subscription_payment'`, `ref_type='subscriptions'`, `ref_id in subscriptionIds`인 row를 읽는다.
3. `delta_cents`를 표시 금액으로 변환한 뒤:
   - `fee = Math.floor(payment * 0.3)`
   - `net = Math.floor(payment * 0.7)`
   - 상태는 고정 문자열 “정산예정”으로 표시한다.

문제:

- 구독 정산의 진실 장부가 없다. 화면이 학생 지갑 차감 원장을 읽고 즉석 계산한다.
- `subscription_renewal` reason은 갱신 RPC에서 사용되는데, 현재 `loadSubscriptionLines()`는 `subscription_payment`만 조회한다. 갱신분 정산 누락 가능성이 있다.
- 상태(`pending/paid/on_hold`)가 없다. 지급 완료, 보류, 환불 보류를 추적할 수 없다.
- `floor(payment*0.3)`와 `floor(payment*0.7)`를 각각 계산하면 합계가 원금과 어긋날 수 있다.

### 원장 한 줄 단위 판정

권장 단위는 **`subscription_billing_events`의 성공 청구 이벤트 1건당 정산 row 1개**다.

이유:

- initial/renewal 모두 같은 테이블에서 `subscription_id/student_id/mentor_id/amount_cents/period/ledger_id/payment_id`를 가진다.
- 학생 지갑 원장(`cash_ledger`)은 돈 차감 장부이고, 멘토 정산 상태를 담기에 맞지 않는다.
- `payments`는 초기 결제 intent 성격이고 갱신은 `process_subscription_renewal()`이 billing event와 ledger를 만든다. 따라서 payments 중심 원장은 갱신분을 자연스럽게 포괄하지 못한다.
- 구독이 단일 멘토 귀속이므로 billing event 1건 -> mentor settlement item 1건이 가장 단순하고 멱등 키도 명확하다.

권장 idempotency key:

- `sub_settlement:<subscription_billing_event_id>`
- unique: `subscription_billing_event_id`

## 2. 맞춤의뢰 정산 패턴 재사용 분석

맞춤의뢰는 이미 정산 원장 모델을 갖고 있다.

근거:

- `supabase/sql/013_p0_custom_order_settlement_items.sql`
  - `custom_order_settlement_items`
  - `custom_request_order_id`, `mentor_id`, `student_id`, `gross_amount`, `platform_fee_amount`, `mentor_amount`, `fee_rate`, `status`, `paid_at`
  - status: `pending`, `on_hold`, `payable`, `paid`, `cancelled`
  - 주문당 unique index `uq_cosi_one_per_order`
- `supabase/sql/014_p0_harden_custom_order_settlement_items.sql`
  - 학생 직접 insert 정책 제거
  - `gross_amount > 0`, `mentor_amount > 0`, `platform_fee_amount >= 0`, `platform_fee_amount + mentor_amount = gross_amount` CHECK
- `supabase/sql/043_p1_accept_order_settlement_atomic_rpc.sql`
  - 납품 수락 시 service_role RPC에서 원장 row를 생성
  - `platform_fee = floor(gross * fee_rate)`
  - `mentor_amount = gross - platform_fee`
  - unique 충돌은 멱등 성공으로 처리
- `lib/mentor/mentorPayoutsQueries.ts`
  - 정산 화면은 `custom_order_settlement_items`를 먼저 읽고 상태별 금액을 집계한다.

구독판에 재사용할 점:

- 별도 정산 원장 테이블.
- source row당 unique idempotency.
- 금액 CHECK: `platform_fee + mentor_amount = gross`.
- service_role write, 멘토 본인 read.
- 상태 기반 집계: `pending/on_hold/paid`.

구독판에서 달라야 할 점:

- source는 주문 완료가 아니라 `subscription_billing_events(status='succeeded', event_type in ('initial','renewal'))`다.
- 금액 단위는 기존 구독/지갑 장부와 맞춰 `amount_cents` 기반으로 두는 것이 안전하다. 화면에서는 기존 `minorUnitsToCash()`로 KRW 표시를 하면 된다.
- 환불/해지는 `subscription_billing_events`와 `refunds`/`subscriptions.status`를 함께 봐야 한다.

## 3. 정산 원장 SQL 초안 + 집계 RPC 초안 + RLS

다음 빈 번호 기준 초안 파일명: `086_subscription_settlement_items.sql`

주의: 아래는 문서 내 설계 초안이다. 적용 금지. Claude 검토 후 별도 SQL 파일 생성/실행 절차가 필요하다.

```sql
-- =============================================================================
-- 086_subscription_settlement_items.sql
-- Purpose: subscription billing event -> mentor settlement ledger
-- Scope:
--   - Add subscription_settlement_items table.
--   - Add service_role-only refresh/aggregate RPC.
--   - No real bank transfer execution.
--   - No cash_ledger mutation.
--   - No escrow/070/077/refund RPC changes.
-- Prerequisite: 064_subscription_billing_period_schema.sql, 068_subscription_renewal_rpc.sql
-- =============================================================================

create table if not exists public.subscription_settlement_items (
  id uuid primary key default gen_random_uuid(),

  subscription_billing_event_id uuid not null
    references public.subscription_billing_events(id) on delete restrict,
  subscription_id uuid not null
    references public.subscriptions(id) on delete restrict,
  mentor_id uuid not null
    references public.users(id) on delete restrict,
  student_id uuid references public.users(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  ledger_id uuid references public.cash_ledger(id) on delete set null,

  event_type text not null check (event_type in ('initial', 'renewal')),
  billing_at timestamptz not null,
  period_start timestamptz,
  period_end timestamptz,
  settlement_month date not null,

  gross_amount_cents bigint not null,
  platform_fee_amount_cents bigint not null,
  mentor_amount_cents bigint not null,
  fee_rate numeric not null default 0.30,

  status text not null default 'pending'
    check (status in ('pending', 'on_hold', 'paid', 'cancelled')),
  hold_reason text,
  paid_at timestamptz,

  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ssi_unique_billing_event unique (subscription_billing_event_id),
  constraint ssi_amounts_positive check (
    gross_amount_cents > 0
    and platform_fee_amount_cents >= 0
    and mentor_amount_cents > 0
    and platform_fee_amount_cents + mentor_amount_cents = gross_amount_cents
  ),
  constraint ssi_fee_rate_bounds check (fee_rate >= 0 and fee_rate <= 1),
  constraint ssi_paid_at_required check (status <> 'paid' or paid_at is not null)
);

create index if not exists idx_ssi_mentor_month_status
  on public.subscription_settlement_items (mentor_id, settlement_month desc, status);

create index if not exists idx_ssi_subscription_period
  on public.subscription_settlement_items (subscription_id, period_start, period_end);

create index if not exists idx_ssi_billing_at
  on public.subscription_settlement_items (billing_at desc);

drop trigger if exists trg_ssi_set_updated on public.subscription_settlement_items;
create trigger trg_ssi_set_updated
  before update on public.subscription_settlement_items
  for each row execute function public.set_updated_at();

alter table public.subscription_settlement_items enable row level security;

revoke all on public.subscription_settlement_items from anon;
grant select on public.subscription_settlement_items to authenticated;
grant all on public.subscription_settlement_items to service_role;

-- Mentor can read only their own settlement ledger.
drop policy if exists "ssi_select_mentor_own" on public.subscription_settlement_items;
create policy "ssi_select_mentor_own"
  on public.subscription_settlement_items
  for select
  to authenticated
  using (mentor_id = (select auth.uid()));

-- No INSERT/UPDATE/DELETE policies for authenticated users.
-- Admin screens should read/write via server-side service_role path.
-- If a future admin session-client screen must read this table directly,
-- add a separate minimal is_admin() SELECT policy after review.

create or replace function public.refresh_subscription_settlement_items(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  status text,
  item_count bigint,
  gross_amount_cents bigint,
  platform_fee_amount_cents bigint,
  mentor_amount_cents bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  with source_events as (
    select
      e.id as billing_event_id,
      e.subscription_id,
      e.student_id,
      e.mentor_id,
      e.payment_id,
      e.ledger_id,
      e.event_type,
      coalesce(e.billing_at, e.processed_at, e.created_at) as billing_at,
      e.period_start,
      e.period_end,
      e.amount_cents::bigint as gross_amount_cents
    from public.subscription_billing_events e
    where e.status = 'succeeded'
      and e.event_type in ('initial', 'renewal')
      and coalesce(e.amount_cents, 0) > 0
      and (p_from is null or coalesce(e.billing_at, e.processed_at, e.created_at) >= p_from)
      and (p_to is null or coalesce(e.billing_at, e.processed_at, e.created_at) < p_to)
  ), calculated as (
    select
      s.*,
      floor(s.gross_amount_cents * 0.30)::bigint as platform_fee_amount_cents,
      (s.gross_amount_cents - floor(s.gross_amount_cents * 0.30)::bigint) as mentor_amount_cents,
      date_trunc('month', s.billing_at)::date as settlement_month
    from source_events s
  )
  insert into public.subscription_settlement_items (
    subscription_billing_event_id,
    subscription_id,
    mentor_id,
    student_id,
    payment_id,
    ledger_id,
    event_type,
    billing_at,
    period_start,
    period_end,
    settlement_month,
    gross_amount_cents,
    platform_fee_amount_cents,
    mentor_amount_cents,
    fee_rate,
    status,
    idempotency_key
  )
  select
    c.billing_event_id,
    c.subscription_id,
    c.mentor_id,
    c.student_id,
    c.payment_id,
    c.ledger_id,
    c.event_type,
    c.billing_at,
    c.period_start,
    c.period_end,
    c.settlement_month,
    c.gross_amount_cents,
    c.platform_fee_amount_cents,
    c.mentor_amount_cents,
    0.30,
    'pending',
    'sub_settlement:' || c.billing_event_id::text
  from calculated c
  on conflict (subscription_billing_event_id) do nothing;

  return query
  select
    i.status,
    count(*)::bigint as item_count,
    coalesce(sum(i.gross_amount_cents), 0)::bigint as gross_amount_cents,
    coalesce(sum(i.platform_fee_amount_cents), 0)::bigint as platform_fee_amount_cents,
    coalesce(sum(i.mentor_amount_cents), 0)::bigint as mentor_amount_cents
  from public.subscription_settlement_items i
  where (p_from is null or i.billing_at >= p_from)
    and (p_to is null or i.billing_at < p_to)
  group by i.status
  order by i.status;
end;
$$;

revoke all on function public.refresh_subscription_settlement_items(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.refresh_subscription_settlement_items(timestamptz, timestamptz) to service_role;

comment on table public.subscription_settlement_items is
  'Mentor settlement ledger for succeeded subscription billing events. This records payable state only; actual bank transfer is separate.';

comment on function public.refresh_subscription_settlement_items(timestamptz, timestamptz) is
  'Service-role-only idempotent sync from succeeded subscription_billing_events to subscription_settlement_items, returning status aggregates.';
```

### 화면 전환 설계

적용 단계에서는 `lib/mentor/mentorPayoutsService.ts`의 `loadSubscriptionLines()`가 즉석 `cash_ledger` 계산 대신 `subscription_settlement_items`를 읽어야 한다.

권장 순서:

1. 먼저 `subscription_settlement_items`를 `mentor_id`로 조회한다.
2. 상태 매핑:
   - `pending` -> 정산예정/scheduled
   - `on_hold` -> 보류/hold
   - `paid` -> 지급완료/paid
   - `cancelled` -> 취소/cancelled
3. 금액은 `gross_amount_cents`, `platform_fee_amount_cents`, `mentor_amount_cents`를 `minorUnitsToCash()`로 표시한다.
4. 테이블이 없거나 row가 아직 없으면 기존 방식으로 fallback한다. 단 fallback은 “추정치”임을 내부적으로만 구분하고, 배포 후 운영 batch/RPC로 원장 backfill을 완료해야 한다.
5. `subscription_payment`뿐 아니라 `subscription_renewal`도 원장화 대상이므로 화면은 원장 기준으로 전환해야 한다.

## 4. 반올림 통일 방식, 상태 모델, 환불 연계

### 반올림

현재 구독 화면 방식:

- `fee = floor(payment * 0.3)`
- `mentor = floor(payment * 0.7)`

문제:

- `payment`가 1원 단위에서 10으로 나누어떨어지지 않으면 `fee + mentor < payment`가 될 수 있다.

권장 방식:

- `fee = floor(gross * 0.30)`
- `mentor = gross - fee`

구독 원장에서는 cents 기준으로:

- `platform_fee_amount_cents = floor(gross_amount_cents * 0.30)`
- `mentor_amount_cents = gross_amount_cents - platform_fee_amount_cents`

이 방식은 맞춤의뢰 `043`과 같다. 잔돈은 멘토 귀속이다.

### 상태 모델

초기 상태:

- `pending`: 정산 대상이지만 아직 송금되지 않음.

운영 보류:

- `on_hold`: 환불 요청, 분쟁/운영 검토, 이상 거래 등으로 지급 보류.
- `hold_reason`에 `refund_pending`, `manual_review`, `billing_anomaly` 같은 운영 코드를 기록한다.

지급 완료:

- `paid`: 실제 송금 완료 후 전환. **이번 범위 밖**이다.
- `paid_at` 필수.
- 나중에 지급 batch 또는 관리자 송금 확인 RPC가 별도로 필요하다.

취소:

- `cancelled`: 정산 대상에서 제외하기로 확정된 항목. 예: 전액 환불 승인으로 지급하지 않는 청구 이벤트.

### 환불/해지 관계

- `cancel_at_period_end`: 다음 갱신을 막는 예약 상태다. 이미 성공한 과거 billing event의 정산 원장을 자동 취소하지 않는다.
- `past_due`/갱신 실패: `subscription_billing_events.status='failed'`라 정산 원장 생성 대상이 아니다.
- `expired`: 신규 성공 billing event가 없으므로 추가 정산 없음. 기존 성공 event는 별도 환불이 없다면 유지.
- `subscription_prorated` 환불 요청 pending:
  - 아직 `paid`가 아닌 정산 row는 `on_hold`로 바꾸는 운영 RPC가 필요하다.
  - 이번 SQL 초안의 refresh 함수는 원장 생성만 하고 환불 status update는 하지 않는다. 환불 연동은 적용 단계에서 별도 함수로 넣을지 검토해야 한다.
- 환불 승인 후 `subscriptions.status='refunded'`:
  - 미지급 원장은 `cancelled` 또는 환불 금액에 따른 조정 row가 필요하다.
  - 이미 `paid`인 항목의 사후 환불은 다음 지급에서 차감하는 별도 adjustment ledger가 필요하다. 실제 송금/차감은 이번 범위 밖이다.

권장 후속:

- `sync_subscription_refund_settlement_holds(p_subscription_id uuid)` 같은 service_role 함수로 pending refund 발생 시 미지급 원장을 `on_hold` 처리.
- refund succeeded 시 unpaid row는 `cancelled`, paid row는 별도 `subscription_settlement_adjustments`로 추후 설계.

## 5. 리스크, 미터치 확인, 적용 범위

### 리스크

- 운영 DB에 `064`가 완전히 적용되지 않았거나 `subscription_billing_events` backfill이 누락되면 원장 생성 대상이 비어 있을 수 있다. 적용 전 `subscription_billing_events`의 initial/renewal succeeded count를 확인해야 한다.
- 기존 화면 fallback이 `cash_ledger.reason='subscription_payment'`만 보므로 갱신분(`subscription_renewal`)과 mismatch가 날 수 있다. 원장 전환 전후 수치 대조가 필요하다.
- 구독 가격은 멘토별 `mentor_plans.amount_cents`에서 온다. 가격 변경 후 갱신분은 갱신 당시 billing event amount를 원장에 고정해야 한다.
- 환불/해지와 정산 보류/취소의 연결은 별도 운영 정책이 필요하다. 특히 paid 이후 환불은 단순 status update로 해결하면 안 된다.
- 관리자 화면이 session client로 정산 원장을 읽어야 한다면 `is_admin()` select 정책 추가 여부를 별도 검토해야 한다. 기본 설계는 admin read/write를 server service_role 경로로 둔다.

### 미터치 확인

이번 문서는 설계 조사만 포함한다.

- 에스크로 054~057 미터치.
- 070/077 미터치.
- 결제/환불 030/068/069 미터치.
- `cash_ledger` 구조 변경 없음.
- 기존 append-only 원장 변경 없음.
- RLS 완화 실행 없음.
- 실제 SQL 파일 생성 없음.
- 실제 송금 실행은 범위 밖.

### 적용 시 필요한 새 SQL 범위

필요 범위는 새 SQL 1개가 기본이다.

- `086_subscription_settlement_items.sql`
  - `subscription_settlement_items` 테이블.
  - RLS: 멘토 본인 read, service_role write/admin read.
  - service_role 전용 refresh/aggregate RPC.
  - 금액 CHECK와 unique idempotency.

환불 연동을 같은 번호에 넣을지는 적용 전 결정해야 한다. 최소 구현은 원장 생성 + 화면 전환이고, 환불 pending/approved 상태 전이는 별도 087로 분리하는 편이 더 안전하다.