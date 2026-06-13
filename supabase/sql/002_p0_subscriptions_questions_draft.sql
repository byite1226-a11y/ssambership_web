-- [의존 순서] 이 파일은 001_initial_auth_profile.sql 이후 적용할 것
-- [번호 충돌] 접두 002 — 동일 번호: 002_app_core_schema_draft.sql, 002_custom_request_orders_status.sql
--   (이 파일: P0 구독·결제·Q&A. 적용 이력 불명 시 번호 변경 없이 Runbook 순서로만 적용)
-- =============================================================================
-- DRAFT P0 (002) — 구독/결제 intent, 멘토–학생 room, Q&A, 알림
--   • Supabase/프로덕션에 직접 적용하지 마세요.
--   • 001_initial_auth_profile.sql (public.users 등) 이후에만 실행하도록 가정.
--   • 002_app_core_schema_draft.sql 은 인벤토리 초안, 본 파일은 P0 적용용(compatibility).
--   • 2025-04 보강: markPaymentSucceeded / insertSubscriptionRow / read 알림 대응 RLS
--   • 장기: service_role 웹훅 기준 쓰기 — 현재는 앱 finalize·보상 delete 최소 동작
-- [불확실] payments에 student_id·payer_id 는 탐지용(구 앱) — user_id 권한과 동일 주체
-- =============================================================================

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- -----------------------------------------------------------------------------
-- payments
--   • user_id: 결제(의뢰) 학생 — RLS "본인" 기준
--   • status: intent는 pending|processing, finalize 시 succeeded|paid|…(앱 markPayment*)
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  -- 탐지용(구 스키마/ pickExistingColumn) — RLS·정책의 주체는 user_id
  student_id uuid references public.users (id) on delete set null,
  payer_id uuid references public.users (id) on delete set null,
  mentor_id uuid references public.users (id) on delete set null,
  amount numeric not null,
  currency text not null default 'KRW',
  status text not null default 'pending' check (
    status in (
      'pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded',
      'paid', 'success', 'complete', 'captured' -- markPaymentSucceeded 후보
    )
  ),
  kind text,
  idempotency_key text unique,
  external_id text,
  metadata jsonb,
  data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_payments_set_updated on public.payments;
create trigger trg_payments_set_updated
  before update on public.payments
  for each row execute function public.set_updated_at();

create index if not exists idx_payments_user on public.payments (user_id, created_at desc);
create index if not exists idx_payments_mentor on public.payments (mentor_id, created_at desc);
create index if not exists idx_payments_status on public.payments (status, created_at desc);

alter table public.payments enable row level security;
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select to authenticated
  using ( (select auth.uid()) in (user_id, student_id, payer_id, mentor_id) );

drop policy if exists "payments_insert_intent" on public.payments;
create policy "payments_insert_intent" on public.payments
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (status in ('pending', 'processing'))
  );
-- [compatibility] 본인 결제 행만 status 갱신( finalize, 멱등 완료 처리)
drop policy if exists "payments_update_own" on public.payments;
create policy "payments_update_own" on public.payments
  for update to authenticated
  using ( (select auth.uid()) in (user_id, student_id, payer_id) )
  with check ( (select auth.uid()) in (user_id, student_id, payer_id) );
-- [보안] service_role: RLS bypass — 어느 user row 도 서버에서만; 클라 wide update 금지
-- [마이그레이션] 전부 service_role 로만 쓰게 바꾸는 경우 이 policy 제거

-- -----------------------------------------------------------------------------
-- subscriptions
-- -----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  mentor_id uuid not null references public.users (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  plan_tier text,
  plan_id uuid, -- app insertSubscriptionRow( mentor_plans id )
  status text not null default 'pending' check (status in ('pending', 'active', 'past_due', 'canceled', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_subscriptions_pair on public.subscriptions (student_id, mentor_id);
create index if not exists idx_subs_status on public.subscriptions (status, updated_at desc);
drop trigger if exists trg_subs_set_updated on public.subscriptions;
create trigger trg_subs_set_updated
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions_select_parties" on public.subscriptions;
create policy "subscriptions_select_parties" on public.subscriptions
  for select to authenticated
  using ( (select auth.uid()) in (student_id, mentor_id) );

-- finalize: student 세션으로 active 구독 insert
drop policy if exists "subscriptions_insert_student" on public.subscriptions;
create policy "subscriptions_insert_student" on public.subscriptions
  for insert to authenticated
  with check ( (select auth.uid()) = student_id and status in ('pending', 'active', 'expired', 'canceled', 'past_due') );
-- (status는 앱이 active — 위 리스트에 포함; 스키마 default는 pending)
drop policy if exists "subscriptions_update_student" on public.subscriptions;
create policy "subscriptions_update_student" on public.subscriptions
  for update to authenticated
  using ( (select auth.uid()) = student_id )
  with check ( (select auth.uid()) = student_id );
-- [참고] mentor row 는 update 정책 없음(읽기만)
-- finalize 실패 시 보상: 본인 구독 row 삭제
drop policy if exists "subscriptions_delete_student" on public.subscriptions;
create policy "subscriptions_delete_student" on public.subscriptions
  for delete to authenticated
  using ( (select auth.uid()) = student_id );

-- -----------------------------------------------------------------------------
-- mentor_student_rooms
-- -----------------------------------------------------------------------------
create table if not exists public.mentor_student_rooms (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  mentor_id uuid not null references public.users (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_msr_pair on public.mentor_student_rooms (student_id, mentor_id);
drop trigger if exists trg_msr_set_updated on public.mentor_student_rooms;
create trigger trg_msr_set_updated
  before update on public.mentor_student_rooms
  for each row execute function public.set_updated_at();

alter table public.mentor_student_rooms enable row level security;
create policy "msr_select" on public.mentor_student_rooms
  for select to authenticated
  using ( (select auth.uid()) in (student_id, mentor_id) );
create policy "msr_insert_pair" on public.mentor_student_rooms
  for insert to authenticated
  with check ( (select auth.uid()) in (student_id, mentor_id) );
create policy "msr_update_parties" on public.mentor_student_rooms
  for update to authenticated
  using ( (select auth.uid()) in (student_id, mentor_id) )
  with check ( (select auth.uid()) in (student_id, mentor_id) );
-- service_role: bypass

-- -----------------------------------------------------------------------------
-- question_threads
-- -----------------------------------------------------------------------------
create table if not exists public.question_threads (
  id uuid primary key default gen_random_uuid(),
  mentor_student_room_id uuid not null references public.mentor_student_rooms (id) on delete cascade,
  title text,
  status text default 'open' check (status in ('open', 'closed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_qt_msr on public.question_threads (mentor_student_room_id, created_at desc);
drop trigger if exists trg_qt_set_updated on public.question_threads;
create trigger trg_qt_set_updated
  before update on public.question_threads
  for each row execute function public.set_updated_at();

alter table public.question_threads enable row level security;
create policy "qt_select_via_room" on public.question_threads
  for select to authenticated
  using (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = question_threads.mentor_student_room_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  );
create policy "qt_write_via_room" on public.question_threads
  for insert to authenticated
  with check (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = mentor_student_room_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  );
create policy "qt_update_via_room" on public.question_threads
  for update to authenticated
  using (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = question_threads.mentor_student_room_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  )
  with check (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = mentor_student_room_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  );

-- -----------------------------------------------------------------------------
-- question_messages
-- -----------------------------------------------------------------------------
create table if not exists public.question_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.question_threads (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_qm_thread on public.question_messages (thread_id, created_at asc);

alter table public.question_messages enable row level security;
create policy "qm_select" on public.question_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.question_threads t
      join public.mentor_student_rooms r on r.id = t.mentor_student_room_id
      where t.id = question_messages.thread_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  );
create policy "qm_insert" on public.question_messages
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and exists (
      select 1 from public.question_threads t
      join public.mentor_student_rooms r on r.id = t.mentor_student_room_id
      where t.id = thread_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  );
-- update/delete 없음(append)

-- -----------------------------------------------------------------------------
-- connection_notes
-- -----------------------------------------------------------------------------
create table if not exists public.connection_notes (
  id uuid primary key default gen_random_uuid(),
  mentor_student_room_id uuid not null references public.mentor_student_rooms (id) on delete cascade,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cn_msr on public.connection_notes (mentor_student_room_id, updated_at desc);
drop trigger if exists trg_cn_set_updated on public.connection_notes;
create trigger trg_cn_set_updated
  before update on public.connection_notes
  for each row execute function public.set_updated_at();

alter table public.connection_notes enable row level security;
create policy "cn_select" on public.connection_notes
  for select to authenticated
  using (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = connection_notes.mentor_student_room_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  );
create policy "cn_insert" on public.connection_notes
  for insert to authenticated
  with check (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = mentor_student_room_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  );
create policy "cn_update" on public.connection_notes
  for update to authenticated
  using (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = connection_notes.mentor_student_room_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  )
  with check (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = mentor_student_room_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  );
create policy "cn_delete" on public.connection_notes
  for delete to authenticated
  using (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = connection_notes.mentor_student_room_id
        and ( (select auth.uid()) in (r.student_id, r.mentor_id) )
    )
  );

-- -----------------------------------------------------------------------------
-- notifications — 수신자 후보(앱 pickExistingColumn) + read 후보
--   • authenticated insert/delete 없음(시스템/서비스) — [delete policy 없음=거부]
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text,
  body text,
  is_read boolean not null default false,
  read boolean,
  acknowledged boolean,
  read_at timestamptz,
  read_at_utc timestamptz,
  seen_at timestamptz,
  opened_at timestamptz,
  viewed_at timestamptz,
  acknowledged_at timestamptz,
  metadata jsonb,
  data jsonb,
  -- 수신(정확히 하나는 반드시 설정 권장) — RLS: 아래 id 중 auth.uid() 일치
  user_id uuid references public.users (id) on delete cascade,
  recipient_id uuid references public.users (id) on delete cascade,
  student_id uuid references public.users (id) on delete cascade,
  mentor_id uuid references public.users (id) on delete cascade,
  target_user_id uuid references public.users (id) on delete cascade,
  owner_id uuid references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_at_least_one_recipient check (
    user_id is not null
    or recipient_id is not null
    or student_id is not null
    or mentor_id is not null
    or target_user_id is not null
    or owner_id is not null
  )
);
create index if not exists idx_notif_user_unread on public.notifications (user_id, is_read, created_at desc);
create index if not exists idx_notif_recipient on public.notifications (recipient_id, is_read, created_at desc);
drop trigger if exists trg_notif_set_updated on public.notifications;
create trigger trg_notif_set_updated
  before update on public.notifications
  for each row execute function public.set_updated_at();

alter table public.notifications enable row level security;
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_recipient" on public.notifications
  for select to authenticated
  using (
    (
      (user_id is not null and (select auth.uid()) = user_id) or
      (recipient_id is not null and (select auth.uid()) = recipient_id) or
      (student_id is not null and (select auth.uid()) = student_id) or
      (mentor_id is not null and (select auth.uid()) = mentor_id) or
      (target_user_id is not null and (select auth.uid()) = target_user_id) or
      (owner_id is not null and (select auth.uid()) = owner_id)
    )
  );
drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_recipient_read" on public.notifications
  for update to authenticated
  using (
    (
      (user_id is not null and (select auth.uid()) = user_id) or
      (recipient_id is not null and (select auth.uid()) = recipient_id) or
      (student_id is not null and (select auth.uid()) = student_id) or
      (mentor_id is not null and (select auth.uid()) = mentor_id) or
      (target_user_id is not null and (select auth.uid()) = target_user_id) or
      (owner_id is not null and (select auth.uid()) = owner_id)
    )
  )
  with check (
    (
      (user_id is not null and (select auth.uid()) = user_id) or
      (recipient_id is not null and (select auth.uid()) = recipient_id) or
      (student_id is not null and (select auth.uid()) = student_id) or
      (mentor_id is not null and (select auth.uid()) = mentor_id) or
      (target_user_id is not null and (select auth.uid()) = target_user_id) or
      (owner_id is not null and (select auth.uid()) = owner_id)
    )
  );
-- insert: authenticated 막힘(시스템) — notif_delete_own 제거(삭제 policy 없음)
drop policy if exists "notif_delete_own" on public.notifications;

-- =============================================================================
-- [참고] 이 파일은 신규 스키마 + 제약/정책. 기존 002_p0 (좁은 notifications)에서 올릴
--   때: notifications 컬럼/제약/정책 diff 스크립트 별도
-- =============================================================================
-- 미적용. 검토·스테이징 먼저.
-- =============================================================================
