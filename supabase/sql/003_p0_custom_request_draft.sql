-- =============================================================================
-- DRAFT P0 (003) — 맞춤의뢰(포스트·지원·주문) + 주문–결제 연결 + 납품/리비전/메시지/이벤트
--   • 미적용. 001 + 002( payments 등 ) 이후 실행.
--   • compatibility: insertWithCandidates + order lifecycle 리터럴(멀티 status 열) 수용
-- [불확실] admin, 시스템 event insert
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

-- id 혼용 컬럼 → canonical(맞춤의뢰 post_id)
create or replace function public.cra_backfill_post_fk()
returns trigger
language plpgsql
as $cra$
begin
  if new.post_id is null and new.custom_request_post_id is not null then
    new.post_id := new.custom_request_post_id;
  end if;
  if new.post_id is null and new.custom_request_id is not null then
    new.post_id := new.custom_request_id;
  end if;
  if new.post_id is null and new.request_id is not null then
    new.post_id := new.request_id;
  end if;
  return new;
end;
$cra$;

-- 주문: post/student/mentor/application id 동의어 → canonical
create or replace function public.cro_backfill_fks()
returns trigger
language plpgsql
as $fn$
begin
  if new.post_id is null and new.custom_request_post_id is not null then
    new.post_id := new.custom_request_post_id;
  end if;
  if new.post_id is null and new.custom_request_id is not null then
    new.post_id := new.custom_request_id;
  end if;
  if new.post_id is null and new.request_id is not null then
    new.post_id := new.request_id;
  end if;

  if new.application_id is null and new.custom_request_application_id is not null then
    new.application_id := new.custom_request_application_id;
  end if;
  if new.application_id is null and new.selected_application_id is not null then
    new.application_id := new.selected_application_id;
  end if;

  if new.mentor_id is null and new.selected_mentor_id is not null then
    new.mentor_id := new.selected_mentor_id;
  end if;
  if new.mentor_id is null and new.assigned_mentor_id is not null then
    new.mentor_id := new.assigned_mentor_id;
  end if;
  if new.mentor_id is null and new.expert_id is not null then
    new.mentor_id := new.expert_id;
  end if;

  if new.student_id is null and new.buyer_id is not null then
    new.student_id := new.buyer_id;
  end if;
  if new.student_id is null and new.client_id is not null then
    new.student_id := new.client_id;
  end if;
  if new.student_id is null and new.user_id is not null then
    new.student_id := new.user_id;
  end if;
  if new.student_id is null and new.author_id is not null then
    new.student_id := new.author_id;
  end if;
  if new.student_id is null and new.requester_id is not null then
    new.student_id := new.requester_id;
  end if;
  return new;
end;
$fn$;

-- -----------------------------------------------------------------------------
-- custom_request_posts
-- -----------------------------------------------------------------------------
create table if not exists public.custom_request_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  title text,
  body text,
  content text,
  subject text,
  description text,
  goal text,
  subcategory text,
  category text,
  due_at timestamptz,
  deadline timestamptz,
  due_date timestamptz,
  deliverable_type text,
  deliverable_format text,
  result_format text,
  output_format text,
  budget_min numeric,
  budget_max numeric,
  student_id uuid references public.users (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  requester_id uuid references public.users (id) on delete set null,
  client_id uuid references public.users (id) on delete set null,
  state text,
  status text not null default 'open' check (
    status in (
      'open', 'closed', 'cancelled', 'canceled', 'fulfilled',
      'pending', 'draft', 'archived', 'in_review', 'in_progress'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.custom_request_posts enable row level security;
create index if not exists idx_crp_author on public.custom_request_posts (author_id, status, created_at desc);
create index if not exists idx_crp_status on public.custom_request_posts (status, created_at desc);
create index if not exists idx_crp_user on public.custom_request_posts (user_id, status, created_at desc);
drop trigger if exists trg_crp_set_updated on public.custom_request_posts;
create trigger trg_crp_set_updated
  before update on public.custom_request_posts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- custom_request_applications
-- post_id NOT NULL: BEFORE INSERT backfill(앱이 custom_request_post_id만 줄 때)
-- status: text (CHECK 생략 — app 리터릴 여유)
-- -----------------------------------------------------------------------------
create table if not exists public.custom_request_applications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.custom_request_posts (id) on delete cascade,
  custom_request_id uuid,
  custom_request_post_id uuid,
  request_id uuid,
  mentor_id uuid not null references public.users (id) on delete cascade,
  applicant_id uuid references public.users (id) on delete set null,
  proposer_id uuid references public.users (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  proposed_price numeric,
  price numeric,
  bid_amount numeric,
  delivery_at timestamptz,
  proposed_due timestamptz,
  due_proposed timestamptz,
  scope text,
  offer_scope text,
  services_offered text,
  cover_letter text,
  message text,
  self_intro text,
  content text,
  extra_answers text,
  answers text,
  notes text,
  school text,
  university text,
  university_name text,
  major text,
  department text,
  field text,
  status text not null default 'submitted',
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.custom_request_applications enable row level security;
create index if not exists idx_cra_post on public.custom_request_applications (post_id, status);
create index if not exists idx_cra_mentor on public.custom_request_applications (mentor_id, created_at desc);
drop trigger if exists trg_cra_backfill on public.custom_request_applications;
create trigger trg_cra_backfill
  before insert on public.custom_request_applications
  for each row execute function public.cra_backfill_post_fk();
drop trigger if exists trg_cra_set_updated on public.custom_request_applications;
create trigger trg_cra_set_updated
  before update on public.custom_request_applications
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- custom_request_orders
--   • post_id, student_id, mentor_id: BEFORE INSERT backfill(동의어 컬럼)
--   • 다중 상태 열: 앱 open / pending / unpaid / … 그대로 저장(후속 단일화)
-- -----------------------------------------------------------------------------
create table if not exists public.custom_request_orders (
  id uuid primary key default gen_random_uuid(),

  post_id uuid not null references public.custom_request_posts (id) on delete restrict,
  application_id uuid references public.custom_request_applications (id) on delete set null,
  student_id uuid not null references public.users (id) on delete restrict,
  mentor_id uuid not null references public.users (id) on delete restrict,

  custom_request_post_id uuid references public.custom_request_posts (id) on delete set null,
  custom_request_id uuid,
  request_id uuid,
  buyer_id uuid references public.users (id) on delete set null,
  client_id uuid references public.users (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  author_id uuid references public.users (id) on delete set null,
  requester_id uuid references public.users (id) on delete set null,
  selected_mentor_id uuid references public.users (id) on delete set null,
  assigned_mentor_id uuid references public.users (id) on delete set null,
  expert_id uuid references public.users (id) on delete set null,
  custom_request_application_id uuid,
  selected_application_id uuid references public.custom_request_applications (id) on delete set null,
  status text,
  state text,
  order_status text,
  stage text,
  payment_status text,
  agreed_price numeric,
  proposed_price numeric,
  price numeric,
  amount numeric,
  started_at timestamptz,
  work_started_at timestamptz,
  in_progress_at timestamptz,
  mentor_started_at timestamptz,
  completed_at timestamptz,
  accepted_at timestamptz,
  closed_at timestamptz,
  finished_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.custom_request_orders enable row level security;
drop trigger if exists trg_cro_backfill on public.custom_request_orders;
create trigger trg_cro_backfill
  before insert on public.custom_request_orders
  for each row execute function public.cro_backfill_fks();
drop trigger if exists trg_cro_set_updated on public.custom_request_orders;
create trigger trg_cro_set_updated
  before update on public.custom_request_orders
  for each row execute function public.set_updated_at();

-- 앱 p3( custom_request_post_id + student + mentor) 만 오면 post/스튜/멘토 backfill
create index if not exists idx_cro_student on public.custom_request_orders (student_id, status);
create index if not exists idx_cro_mentor on public.custom_request_orders (mentor_id, status);
create index if not exists idx_cro_post on public.custom_request_orders (post_id, status);

-- [참고] app 이 post_id 없이 custom_request_post_id만 넣는 경우, 트리거로 post_id 채움.
--   앱 p1: post_id + custom_request_post_id + … 동시 제공 → NOT NULL post_id 는 충족
--   앱 p3: custom_request_post_id, student, mentor — 트리거가 post_id, student, mentor 복사

-- -----------------------------------------------------------------------------
-- order_payments
-- -----------------------------------------------------------------------------
create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  custom_request_order_id uuid not null references public.custom_request_orders (id) on delete cascade,
  payment_id uuid not null references public.payments (id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.order_payments enable row level security;
create unique index if not exists uq_order_payments_pair on public.order_payments (custom_request_order_id, payment_id);
create index if not exists idx_order_payments_order on public.order_payments (custom_request_order_id);
create index if not exists idx_order_payments_pay on public.order_payments (payment_id);

-- -----------------------------------------------------------------------------
-- 자식: custom_request_order_id(필수 FK) + 호환 id 열(비 FK, nullable)
-- -----------------------------------------------------------------------------
create table if not exists public.custom_order_deliverables (
  id uuid primary key default gen_random_uuid(),
  custom_request_order_id uuid not null references public.custom_request_orders (id) on delete cascade,
  order_id uuid,
  custom_order_id uuid,
  request_order_id uuid,
  file_url text,
  note text,
  version int not null default 1,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
alter table public.custom_order_deliverables enable row level security;
create index if not exists idx_cdel_order on public.custom_order_deliverables (custom_request_order_id, version, created_at desc);

create table if not exists public.custom_order_revisions (
  id uuid primary key default gen_random_uuid(),
  custom_request_order_id uuid not null references public.custom_request_orders (id) on delete cascade,
  order_id uuid,
  custom_order_id uuid,
  request_order_id uuid,
  author_id uuid not null references public.users (id) on delete cascade,
  request_note text,
  status text,
  created_at timestamptz not null default now()
);
alter table public.custom_order_revisions enable row level security;
create index if not exists idx_crev_order on public.custom_order_revisions (custom_request_order_id, created_at desc);

create table if not exists public.custom_order_messages (
  id uuid primary key default gen_random_uuid(),
  custom_request_order_id uuid not null references public.custom_request_orders (id) on delete cascade,
  order_id uuid,
  custom_order_id uuid,
  request_order_id uuid,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.custom_order_messages enable row level security;
create index if not exists idx_cmsg_order on public.custom_order_messages (custom_request_order_id, created_at asc);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  custom_request_order_id uuid not null references public.custom_request_orders (id) on delete cascade,
  order_id uuid,
  custom_order_id uuid,
  request_order_id uuid,
  event text,
  kind text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table public.order_events enable row level security;
create index if not exists idx_oev_order on public.order_events (custom_request_order_id, created_at asc);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select coalesce((
    select u.role = 'admin' from public.users u where u.id = auth.uid()
  ), false);
$f$;

-- posts: 앱 3번째 insert 가 author_id 대신 user_id + client_id 만 줄 수 있음
drop policy if exists "crp_select" on public.custom_request_posts;
create policy "crp_select" on public.custom_request_posts
  for select to authenticated
  using (
    author_id = (select auth.uid())
    or user_id = (select auth.uid())
    or student_id = (select auth.uid())
    or requester_id = (select auth.uid())
    or client_id = (select auth.uid())
    or (select public.is_admin()) = true
  );
drop policy if exists "crp_insert" on public.custom_request_posts;
create policy "crp_insert" on public.custom_request_posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    or user_id = (select auth.uid())
    or student_id = (select auth.uid())
    or requester_id = (select auth.uid())
    or client_id = (select auth.uid())
    or (select public.is_admin()) = true
  );
drop policy if exists "crp_update" on public.custom_request_posts;
create policy "crp_update" on public.custom_request_posts
  for update to authenticated
  using (
    author_id = (select auth.uid())
    or user_id = (select auth.uid())
    or student_id = (select auth.uid())
    or requester_id = (select auth.uid())
    or client_id = (select auth.uid())
    or (select public.is_admin()) = true
  )
  with check (
    author_id = (select auth.uid())
    or user_id = (select auth.uid())
    or student_id = (select auth.uid())
    or requester_id = (select auth.uid())
    or client_id = (select auth.uid())
    or (select public.is_admin()) = true
  );

-- applications: post 작성자(멘본인이 지원) / 멘토(지원자) / author match post
drop policy if exists "cra_select" on public.custom_request_applications;
create policy "cra_select" on public.custom_request_applications
  for select to authenticated
  using (
    mentor_id = (select auth.uid())
    or exists (select 1 from public.custom_request_posts p where p.id = post_id and p.author_id = (select auth.uid()))
    or exists (select 1 from public.custom_request_posts p where p.id = post_id and p.user_id = (select auth.uid()))
    or (select public.is_admin()) = true
  );
drop policy if exists "cra_insert" on public.custom_request_applications;
create policy "cra_insert" on public.custom_request_applications
  for insert to authenticated
  with check ( mentor_id = (select auth.uid()) or (select public.is_admin()) = true );
drop policy if exists "cra_update" on public.custom_request_applications;
create policy "cra_update" on public.custom_request_applications
  for update to authenticated
  using (
    mentor_id = (select auth.uid()) or (select public.is_admin()) = true
  )
  with check ( mentor_id = (select auth.uid()) or (select public.is_admin()) = true );

-- orders: student/buyer/client/…/mentor
drop policy if exists "cro_select" on public.custom_request_orders;
create policy "cro_select" on public.custom_request_orders
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or buyer_id = (select auth.uid())
    or client_id = (select auth.uid())
    or user_id = (select auth.uid())
    or author_id = (select auth.uid())
    or requester_id = (select auth.uid())
    or mentor_id = (select auth.uid())
    or (select public.is_admin()) = true
  );
drop policy if exists "cro_insert" on public.custom_request_orders;
create policy "cro_insert" on public.custom_request_orders
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    or buyer_id = (select auth.uid())
    or client_id = (select auth.uid())
    or user_id = (select auth.uid())
    or author_id = (select auth.uid())
    or requester_id = (select auth.uid())
    or (select public.is_admin()) = true
  );
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

-- order_payments, deliverables, …
drop policy if exists "opay_select" on public.order_payments;
create policy "opay_select" on public.order_payments
  for select to authenticated
  using (
    exists (
      select 1 from public.custom_request_orders o
      where o.id = custom_request_order_id
        and ( (select public.is_admin()) = true
          or (select auth.uid()) in (o.student_id, o.mentor_id)
          or o.buyer_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid()) )
    )
  );
drop policy if exists "opay_insert" on public.order_payments;
create policy "opay_insert" on public.order_payments
  for insert to authenticated
  with check ( (select public.is_admin()) = true );

drop policy if exists "cdel_select" on public.custom_order_deliverables;
create policy "cdel_select" on public.custom_order_deliverables
  for select to authenticated
  using (
    exists (
      select 1 from public.custom_request_orders o
      where o.id = custom_request_order_id
        and ( (select public.is_admin()) = true
          or (select auth.uid()) in (o.student_id, o.mentor_id)
          or o.buyer_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid()) )
    )
  );
drop policy if exists "cdel_insert" on public.custom_order_deliverables;
create policy "cdel_insert" on public.custom_order_deliverables
  for insert to authenticated
  with check (
    exists (select 1 from public.custom_request_orders o where o.id = custom_request_order_id and o.mentor_id = (select auth.uid()) )
  );

drop policy if exists "crev_all_party" on public.custom_order_revisions;
create policy "crev_all_party" on public.custom_order_revisions
  for select to authenticated
  using (
    exists (
      select 1 from public.custom_request_orders o
      where o.id = custom_request_order_id
        and ( (select public.is_admin()) = true
          or (select auth.uid()) in (o.student_id, o.mentor_id)
          or o.buyer_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid()) )
    )
  );
drop policy if exists "crev_ins" on public.custom_order_revisions;
create policy "crev_ins" on public.custom_order_revisions
  for insert to authenticated
  with check ( author_id = (select auth.uid()) );

drop policy if exists "cmsg_all_party" on public.custom_order_messages;
create policy "cmsg_all_party" on public.custom_order_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.custom_request_orders o
      where o.id = custom_request_order_id
        and ( (select public.is_admin()) = true
          or (select auth.uid()) in (o.student_id, o.mentor_id)
          or o.buyer_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid()) )
    )
  );
drop policy if exists "cmsg_ins" on public.custom_order_messages;
create policy "cmsg_ins" on public.custom_order_messages
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and exists (
      select 1 from public.custom_request_orders o
      where o.id = custom_request_order_id
        and ( (select auth.uid()) in (o.student_id, o.mentor_id)
          or o.buyer_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid()) )
    )
  );

drop policy if exists "oev_select" on public.order_events;
create policy "oev_select" on public.order_events
  for select to authenticated
  using (
    exists (
      select 1 from public.custom_request_orders o
      where o.id = custom_request_order_id
        and ( (select public.is_admin()) = true
          or (select auth.uid()) in (o.student_id, o.mentor_id)
          or o.buyer_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid()) )
    )
  );

-- =============================================================================
-- 미적용. 검토·스테이징 먼저.
-- =============================================================================
