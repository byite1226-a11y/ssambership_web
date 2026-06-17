-- =============================================================================
-- 070_individual_question_schema_escrow.sql
-- Purpose: Individual one-off questions (cash escrow) Q1 foundation.
--
-- Scope:
--   - New tables for individual questions, messages, attachments, and mentor
--     direct-question pricing.
--   - Private storage bucket + RLS for individual-question attachments.
--   - New escrow RPCs: create/hold, claim, release payout, refund.
--
-- Safety:
--   - Does not modify subscription debit RPC 019.
--   - Does not modify custom-request escrow RPCs 054~057.
--   - Does not modify mentor_student_rooms/question_threads/free quota.
--   - Wallet debits require balance_cents >= price_cents. No negative balance.
--   - Idempotency layers:
--       1) individual_questions.create_idempotency_key unique
--       2) cash_ledger.idempotency_key unique
--       3) row locks on cash_wallets / individual_questions where needed
--
-- Execute after:
--   004_p0_cash_disputes_admin_draft.sql
--   060_ai_readiness_question_schema.sql is not required, but expected in the
--   current app setup.
--
-- Manual verification after running:
--   select * from storage.buckets where id = 'individual-question-attachments';
--   select table_name from information_schema.tables
--     where table_schema = 'public' and table_name like 'individual_question%';
--   select routine_name from information_schema.routines
--     where routine_schema = 'public' and routine_name like '%individual_question%';
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.individual_questions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  question_type text not null check (question_type in ('direct', 'open')),
  designated_mentor_id uuid references public.users(id) on delete set null,
  claimed_mentor_id uuid references public.users(id) on delete set null,
  claimed_at timestamptz,
  subject text,
  topic text,
  title text not null,
  body text not null,
  price_cents int not null check (price_cents > 0),
  status text not null default 'escrowed' check (
    status in (
      'escrowed',
      'assigned',
      'open',
      'claimed',
      'answered',
      'released',
      'expired',
      'refunded',
      'canceled'
    )
  ),
  expires_at timestamptz,
  answered_at timestamptz,
  released_at timestamptz,
  refunded_at timestamptz,
  hold_ledger_id uuid references public.cash_ledger(id) on delete set null,
  release_ledger_id uuid references public.cash_ledger(id) on delete set null,
  refund_ledger_id uuid references public.cash_ledger(id) on delete set null,
  create_idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint individual_questions_direct_mentor_required check (
    question_type <> 'direct' or designated_mentor_id is not null
  ),
  constraint individual_questions_open_claim_consistency check (
    question_type <> 'open' or designated_mentor_id is null
  )
);

drop trigger if exists trg_individual_questions_set_updated on public.individual_questions;
create trigger trg_individual_questions_set_updated
  before update on public.individual_questions
  for each row
  execute function public.set_updated_at();

create index if not exists idx_iq_status_expires
  on public.individual_questions (status, expires_at);

create index if not exists idx_iq_open_list
  on public.individual_questions (question_type, status, created_at desc)
  where status = 'open';

create index if not exists idx_iq_designated_mentor_status
  on public.individual_questions (designated_mentor_id, status, created_at desc);

create index if not exists idx_iq_claimed_mentor_status
  on public.individual_questions (claimed_mentor_id, status, created_at desc);

create index if not exists idx_iq_student_created
  on public.individual_questions (student_id, created_at desc);

create table if not exists public.individual_question_messages (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.individual_questions(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint individual_question_messages_id_question_unique unique (id, question_id)
);

create index if not exists idx_iqm_question_created
  on public.individual_question_messages (question_id, created_at asc);

create table if not exists public.individual_question_attachments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.individual_questions(id) on delete cascade,
  message_id uuid references public.individual_question_messages(id) on delete set null,
  storage_path text not null,
  file_name text,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_iqa_question_created
  on public.individual_question_attachments (question_id, created_at desc);

create index if not exists idx_iqa_message
  on public.individual_question_attachments (message_id);

create table if not exists public.mentor_individual_question_pricing (
  mentor_id uuid primary key references public.users(id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_miqp_set_updated on public.mentor_individual_question_pricing;
create trigger trg_miqp_set_updated
  before update on public.mentor_individual_question_pricing
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.individual_question_user_is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select coalesce((
    select u.role = 'admin'
    from public.users u
    where u.id = p_user_id
  ), false);
$function$;

create or replace function public.individual_question_user_is_approved_mentor(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.mentor_profiles mp
    where mp.user_id = p_user_id
      and lower(coalesce(mp.verification_status, '')) in ('approved', 'verified', 'active')
  );
$function$;

create or replace function public.user_is_individual_question_party(p_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.individual_questions q
    where q.id = p_question_id
      and (
        q.student_id = (select auth.uid())
        or q.designated_mentor_id = (select auth.uid())
        or q.claimed_mentor_id = (select auth.uid())
        or public.individual_question_user_is_admin((select auth.uid()))
      )
  );
$function$;

-- Approved mentors can browse only sanitized open-question fields.
-- Do not expose student_id, body, ledger IDs, or attachment paths here.
create or replace function public.list_open_individual_questions_for_mentor(p_limit integer default 50)
returns table (
  id uuid,
  subject text,
  topic text,
  title text,
  price_cents int,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
begin
  if not public.individual_question_user_is_approved_mentor((select auth.uid())) then
    return;
  end if;

  return query
    select
      q.id,
      q.subject,
      q.topic,
      q.title,
      q.price_cents,
      q.expires_at,
      q.created_at
    from public.individual_questions q
    where q.question_type = 'open'
      and q.status = 'open'
      and q.claimed_mentor_id is null
      and (q.expires_at is null or q.expires_at > now())
    order by q.created_at desc
    limit v_limit;
end;
$function$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.individual_questions enable row level security;
alter table public.individual_question_messages enable row level security;
alter table public.individual_question_attachments enable row level security;
alter table public.mentor_individual_question_pricing enable row level security;

drop policy if exists "iq_select_party" on public.individual_questions;
create policy "iq_select_party"
  on public.individual_questions
  for select
  to authenticated
  using (public.user_is_individual_question_party(id));

drop policy if exists "iqm_select_party" on public.individual_question_messages;
create policy "iqm_select_party"
  on public.individual_question_messages
  for select
  to authenticated
  using (public.user_is_individual_question_party(question_id));

drop policy if exists "iqa_select_party" on public.individual_question_attachments;
create policy "iqa_select_party"
  on public.individual_question_attachments
  for select
  to authenticated
  using (public.user_is_individual_question_party(question_id));

drop policy if exists "miqp_select_authenticated" on public.mentor_individual_question_pricing;
create policy "miqp_select_authenticated"
  on public.mentor_individual_question_pricing
  for select
  to authenticated
  using (true);

-- No authenticated insert/update/delete policies on individual question tables.
-- Mutations must go through service-role server actions / SECURITY DEFINER RPCs.

-- ---------------------------------------------------------------------------
-- Storage bucket + RLS
-- Path rule: <individual_question_id>/<uuid>-<filename>
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'individual-question-attachments',
  'individual-question-attachments',
  false,
  20971520,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = coalesce(excluded.file_size_limit, storage.buckets.file_size_limit),
  allowed_mime_types = coalesce(excluded.allowed_mime_types, storage.buckets.allowed_mime_types);

create or replace function public.individual_question_uuid_from_storage_path(p_name text)
returns uuid
language plpgsql
immutable
security definer
set search_path = public
as $function$
begin
  return nullif(split_part(p_name, '/', 1), '')::uuid;
exception
  when others then
    return null;
end;
$function$;

create or replace function public.user_is_party_for_individual_question_storage_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select public.user_is_individual_question_party(
    public.individual_question_uuid_from_storage_path(p_name)
  );
$function$;

drop policy if exists "iqa_storage_read_party" on storage.objects;
create policy "iqa_storage_read_party"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'individual-question-attachments'
    and public.user_is_party_for_individual_question_storage_path(name)
  );

drop policy if exists "iqa_storage_insert_party" on storage.objects;
create policy "iqa_storage_insert_party"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'individual-question-attachments'
    and public.user_is_party_for_individual_question_storage_path(name)
  );

-- ---------------------------------------------------------------------------
-- RPC return contract
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'individual_question_escrow_result'
  ) then
    execute '
      create type public.individual_question_escrow_result as (
        ok boolean,
        code text,
        message text,
        question_id uuid,
        status text,
        ledger_id uuid,
        wallet_balance_cents bigint
      )
    ';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RPC: create + escrow hold
-- ---------------------------------------------------------------------------

create or replace function public.create_individual_question_with_hold(
  p_student_id uuid,
  p_question_type text,
  p_mentor_id uuid,
  p_subject text,
  p_topic text,
  p_title text,
  p_body text,
  p_price_cents int,
  p_idempotency_key text
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_type text := lower(trim(coalesce(p_question_type, '')));
  v_status text;
  v_idem text := trim(coalesce(p_idempotency_key, ''));
  v_question public.individual_questions%rowtype;
  v_ledger_id uuid;
  v_wallet_balance bigint;
  v_wallet_rows int;
begin
  if p_student_id is null then
    return (false, 'invalid_student', 'student_id is required', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if not exists (select 1 from public.users u where u.id = p_student_id and u.role = 'student') then
    return (false, 'invalid_student', 'student must be a student user', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_type not in ('direct', 'open') then
    return (false, 'invalid_type', 'question_type must be direct or open', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_type = 'direct' and p_mentor_id is null then
    return (false, 'mentor_required', 'direct question requires mentor_id', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_type = 'direct' and not public.individual_question_user_is_approved_mentor(p_mentor_id) then
    return (false, 'mentor_not_approved', 'mentor is not approved for individual questions', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if p_price_cents is null or p_price_cents <= 0 then
    return (false, 'invalid_price', 'price_cents must be positive', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if p_price_cents > 1000000000 then
    return (false, 'price_too_large', 'price_cents is too large', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if length(v_idem) = 0 then
    return (false, 'invalid_idempotency_key', 'idempotency_key is required', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if length(trim(coalesce(p_title, ''))) = 0 or length(trim(coalesce(p_body, ''))) = 0 then
    return (false, 'invalid_content', 'title and body are required', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  select *
    into v_question
  from public.individual_questions
  where create_idempotency_key = v_idem;

  if found then
    select balance_cents
      into v_wallet_balance
    from public.cash_wallets
    where user_id = p_student_id;

    return (
      true,
      'already_exists',
      'individual question already created for idempotency key',
      v_question.id,
      v_question.status,
      v_question.hold_ledger_id,
      v_wallet_balance
    )::public.individual_question_escrow_result;
  end if;

  insert into public.cash_wallets (user_id, balance_cents)
  values (p_student_id, 0)
  on conflict (user_id) do nothing;

  select balance_cents
    into v_wallet_balance
  from public.cash_wallets
  where user_id = p_student_id
  for update;

  -- Re-check idempotency after wallet lock to avoid double debit on concurrent calls.
  select *
    into v_question
  from public.individual_questions
  where create_idempotency_key = v_idem;

  if found then
    return (
      true,
      'already_exists',
      'individual question already created for idempotency key',
      v_question.id,
      v_question.status,
      v_question.hold_ledger_id,
      v_wallet_balance
    )::public.individual_question_escrow_result;
  end if;

  if coalesce(v_wallet_balance, 0) < p_price_cents then
    return (
      false,
      'insufficient_cash',
      'CASH_INSUFFICIENT',
      null,
      null,
      null,
      coalesce(v_wallet_balance, 0)
    )::public.individual_question_escrow_result;
  end if;

  v_status := case when v_type = 'direct' then 'assigned' else 'open' end;

  insert into public.individual_questions (
    student_id,
    question_type,
    designated_mentor_id,
    subject,
    topic,
    title,
    body,
    price_cents,
    status,
    create_idempotency_key
  )
  values (
    p_student_id,
    v_type,
    case when v_type = 'direct' then p_mentor_id else null end,
    nullif(trim(coalesce(p_subject, '')), ''),
    nullif(trim(coalesce(p_topic, '')), ''),
    trim(p_title),
    trim(p_body),
    p_price_cents,
    v_status,
    v_idem
  )
  returning * into v_question;

  insert into public.cash_ledger (
    user_id,
    delta_cents,
    reason,
    ref_type,
    ref_id,
    idempotency_key
  )
  values (
    p_student_id,
    -p_price_cents,
    'individual_question_escrow_hold',
    'individual_questions',
    v_question.id,
    'iq_hold:' || v_question.id::text
  )
  on conflict (idempotency_key) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    raise exception 'INDIVIDUAL_QUESTION_HOLD_LEDGER_CONFLICT';
  end if;

  update public.cash_wallets
  set balance_cents = balance_cents - p_price_cents
  where user_id = p_student_id
    and balance_cents >= p_price_cents
  returning balance_cents into v_wallet_balance;

  get diagnostics v_wallet_rows = row_count;
  if coalesce(v_wallet_rows, 0) = 0 then
    raise exception 'CASH_INSUFFICIENT_AFTER_LOCK' using errcode = 'P0001';
  end if;

  update public.individual_questions
  set hold_ledger_id = v_ledger_id
  where id = v_question.id
  returning * into v_question;

  return (
    true,
    'created',
    'individual question created and cash held',
    v_question.id,
    v_question.status,
    v_ledger_id,
    v_wallet_balance
  )::public.individual_question_escrow_result;
end;
$function$;

-- ---------------------------------------------------------------------------
-- RPC: open question first-claim
-- ---------------------------------------------------------------------------

create or replace function public.claim_individual_question(
  p_question_id uuid,
  p_mentor_id uuid
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_question public.individual_questions%rowtype;
begin
  if p_question_id is null or p_mentor_id is null then
    return (false, 'invalid_input', 'question_id and mentor_id are required', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  if not public.individual_question_user_is_approved_mentor(p_mentor_id) then
    return (false, 'mentor_not_approved', 'mentor is not approved for individual questions', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  update public.individual_questions
  set
    claimed_mentor_id = p_mentor_id,
    claimed_at = now(),
    status = 'claimed'
  where id = p_question_id
    and question_type = 'open'
    and status = 'open'
    and claimed_mentor_id is null
    and (expires_at is null or expires_at > now())
    and student_id <> p_mentor_id
  returning * into v_question;

  if not found then
    return (false, 'not_available', 'question is already claimed, expired, or unavailable', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  return (true, 'claimed', 'individual question claimed', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
end;
$function$;

-- ---------------------------------------------------------------------------
-- RPC: answer accepted -> mentor payout
-- ---------------------------------------------------------------------------

create or replace function public.release_individual_question_payout(
  p_question_id uuid
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_question public.individual_questions%rowtype;
  v_mentor_id uuid;
  v_ledger_id uuid;
  v_wallet_balance bigint;
  v_new_ledger boolean := false;
begin
  if p_question_id is null then
    return (false, 'invalid_question', 'question_id is required', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  select *
    into v_question
  from public.individual_questions
  where id = p_question_id
  for update;

  if not found then
    return (false, 'not_found', 'individual question not found', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_question.release_ledger_id is not null or v_question.status = 'released' then
    return (true, 'already_released', 'individual question already released', v_question.id, v_question.status, v_question.release_ledger_id, null)::public.individual_question_escrow_result;
  end if;

  if v_question.refund_ledger_id is not null or v_question.status = 'refunded' then
    return (false, 'already_refunded', 'individual question already refunded', v_question.id, v_question.status, v_question.refund_ledger_id, null)::public.individual_question_escrow_result;
  end if;

  if v_question.status <> 'answered' then
    return (false, 'not_answered', 'question must be answered before payout', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  if v_question.hold_ledger_id is null then
    return (false, 'hold_missing', 'escrow hold ledger is missing', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  v_mentor_id := coalesce(v_question.claimed_mentor_id, v_question.designated_mentor_id);
  if v_mentor_id is null then
    return (false, 'mentor_missing', 'mentor is missing', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  if exists (
    select 1
    from public.cash_ledger l
    where l.idempotency_key = 'iq_refund:' || v_question.id::text
      and l.reason = 'individual_question_refund'
  ) then
    return (false, 'already_refunded', 'refund ledger already exists', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  insert into public.cash_ledger (
    user_id,
    delta_cents,
    reason,
    ref_type,
    ref_id,
    idempotency_key
  )
  values (
    v_mentor_id,
    v_question.price_cents,
    'individual_question_payout',
    'individual_questions',
    v_question.id,
    'iq_payout:' || v_question.id::text
  )
  on conflict (idempotency_key) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is not null then
    v_new_ledger := true;
  else
    select id
      into v_ledger_id
    from public.cash_ledger
    where idempotency_key = 'iq_payout:' || v_question.id::text
      and reason = 'individual_question_payout';
  end if;

  if v_ledger_id is null then
    raise exception 'INDIVIDUAL_QUESTION_PAYOUT_LEDGER_MISSING';
  end if;

  if v_new_ledger then
    insert into public.cash_wallets (user_id, balance_cents)
    values (v_mentor_id, 0)
    on conflict (user_id) do nothing;

    update public.cash_wallets
    set balance_cents = balance_cents + v_question.price_cents
    where user_id = v_mentor_id
    returning balance_cents into v_wallet_balance;

    if not found then
      raise exception 'INDIVIDUAL_QUESTION_MENTOR_WALLET_CREDIT_FAILED';
    end if;
  end if;

  update public.individual_questions
  set
    status = 'released',
    released_at = coalesce(released_at, now()),
    release_ledger_id = v_ledger_id
  where id = v_question.id
  returning * into v_question;

  return (true, 'released', 'individual question payout released', v_question.id, v_question.status, v_ledger_id, v_wallet_balance)::public.individual_question_escrow_result;
end;
$function$;

-- ---------------------------------------------------------------------------
-- RPC: escrow refund
-- ---------------------------------------------------------------------------

create or replace function public.refund_individual_question_hold(
  p_question_id uuid
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_question public.individual_questions%rowtype;
  v_ledger_id uuid;
  v_wallet_balance bigint;
  v_new_ledger boolean := false;
begin
  if p_question_id is null then
    return (false, 'invalid_question', 'question_id is required', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  select *
    into v_question
  from public.individual_questions
  where id = p_question_id
  for update;

  if not found then
    return (false, 'not_found', 'individual question not found', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_question.refund_ledger_id is not null or v_question.status = 'refunded' then
    return (true, 'already_refunded', 'individual question already refunded', v_question.id, v_question.status, v_question.refund_ledger_id, null)::public.individual_question_escrow_result;
  end if;

  if v_question.release_ledger_id is not null or v_question.status = 'released' then
    return (false, 'already_released', 'individual question already released', v_question.id, v_question.status, v_question.release_ledger_id, null)::public.individual_question_escrow_result;
  end if;

  if v_question.hold_ledger_id is null then
    return (false, 'hold_missing', 'escrow hold ledger is missing', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  if exists (
    select 1
    from public.cash_ledger l
    where l.idempotency_key = 'iq_payout:' || v_question.id::text
      and l.reason = 'individual_question_payout'
  ) then
    return (false, 'already_released', 'payout ledger already exists', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  insert into public.cash_ledger (
    user_id,
    delta_cents,
    reason,
    ref_type,
    ref_id,
    idempotency_key
  )
  values (
    v_question.student_id,
    v_question.price_cents,
    'individual_question_refund',
    'individual_questions',
    v_question.id,
    'iq_refund:' || v_question.id::text
  )
  on conflict (idempotency_key) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is not null then
    v_new_ledger := true;
  else
    select id
      into v_ledger_id
    from public.cash_ledger
    where idempotency_key = 'iq_refund:' || v_question.id::text
      and reason = 'individual_question_refund';
  end if;

  if v_ledger_id is null then
    raise exception 'INDIVIDUAL_QUESTION_REFUND_LEDGER_MISSING';
  end if;

  if v_new_ledger then
    insert into public.cash_wallets (user_id, balance_cents)
    values (v_question.student_id, 0)
    on conflict (user_id) do nothing;

    update public.cash_wallets
    set balance_cents = balance_cents + v_question.price_cents
    where user_id = v_question.student_id
    returning balance_cents into v_wallet_balance;

    if not found then
      raise exception 'INDIVIDUAL_QUESTION_STUDENT_WALLET_REFUND_FAILED';
    end if;
  end if;

  update public.individual_questions
  set
    status = 'refunded',
    refunded_at = coalesce(refunded_at, now()),
    refund_ledger_id = v_ledger_id
  where id = v_question.id
  returning * into v_question;

  return (true, 'refunded', 'individual question escrow refunded', v_question.id, v_question.status, v_ledger_id, v_wallet_balance)::public.individual_question_escrow_result;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.individual_question_user_is_admin(uuid) from public, anon;
grant execute on function public.individual_question_user_is_admin(uuid) to authenticated, service_role;

revoke all on function public.individual_question_user_is_approved_mentor(uuid) from public, anon;
grant execute on function public.individual_question_user_is_approved_mentor(uuid) to authenticated, service_role;

revoke all on function public.user_is_individual_question_party(uuid) from public, anon;
grant execute on function public.user_is_individual_question_party(uuid) to authenticated, service_role;

revoke all on function public.list_open_individual_questions_for_mentor(integer) from public, anon;
grant execute on function public.list_open_individual_questions_for_mentor(integer) to authenticated;

revoke all on function public.create_individual_question_with_hold(uuid, text, uuid, text, text, text, text, int, text) from public, anon, authenticated;
grant execute on function public.create_individual_question_with_hold(uuid, text, uuid, text, text, text, text, int, text) to service_role;

revoke all on function public.claim_individual_question(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_individual_question(uuid, uuid) to service_role;

revoke all on function public.release_individual_question_payout(uuid) from public, anon, authenticated;
grant execute on function public.release_individual_question_payout(uuid) to service_role;

revoke all on function public.refund_individual_question_hold(uuid) from public, anon, authenticated;
grant execute on function public.refund_individual_question_hold(uuid) to service_role;

comment on table public.individual_questions is
  'Q1 individual one-off questions. Cash is held at creation and released/refunded by dedicated RPCs.';

comment on table public.mentor_individual_question_pricing is
  'Mentor direct-question answer price. Separate from subscription mentor_plans.';

comment on function public.create_individual_question_with_hold(uuid, text, uuid, text, text, text, text, int, text) is
  'Q1 individual question create + escrow hold. service_role only.';

comment on function public.claim_individual_question(uuid, uuid) is
  'Q1 open individual question first-claim. Atomic update where claimed_mentor_id is null. service_role only.';

comment on function public.release_individual_question_payout(uuid) is
  'Q1 individual question payout. Requires status=answered and no refund/payout. service_role only.';

comment on function public.refund_individual_question_hold(uuid) is
  'Q1 individual question escrow refund. Blocks if payout exists. service_role only.';
