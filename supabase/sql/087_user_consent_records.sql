-- =============================================================================
-- 087_user_consent_records.sql
-- Purpose: Signup consent ledger skeleton, including under-14 guardian consent.
-- Scope:
--   - Create user_consent_records.
--   - Persist signup consent records from auth.users raw_user_meta_data.
--   - Legal wording / guardian verification details remain placeholders.
--   - No auth/session core changes, no payment/escrow/070/077 changes.
-- =============================================================================

begin;

create table if not exists public.user_consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms', 'privacy', 'marketing', 'minor_guardian_consent')),
  consent_actor text not null check (consent_actor in ('user', 'guardian')),
  is_minor boolean not null default false,
  guardian_consent boolean not null default false,
  consent_version text not null,
  guardian_ref text,
  agreed_at timestamptz not null default now(),
  source text not null default 'signup',
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.user_consent_records is
  'Append-only signup consent ledger. Includes under-14 guardian consent skeleton; legal wording and verification method are placeholders.';
comment on column public.user_consent_records.guardian_ref is
  'Reserved for legal-approved guardian identity/verification reference. Keep null until legal chooses the method.';
comment on column public.user_consent_records.metadata is
  'Non-public operational metadata for consent provenance. Do not expose publicly.';

create index if not exists idx_ucr_user_created
  on public.user_consent_records (user_id, created_at desc);

create index if not exists idx_ucr_user_type_created
  on public.user_consent_records (user_id, consent_type, created_at desc);

alter table public.user_consent_records enable row level security;

revoke all on table public.user_consent_records from anon;
revoke insert, update, delete on table public.user_consent_records from authenticated;
grant select on table public.user_consent_records to authenticated;
grant all on table public.user_consent_records to service_role;

drop policy if exists "ucr_select_own" on public.user_consent_records;
create policy "ucr_select_own"
  on public.user_consent_records
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No authenticated write policy. Signup writes are handled by SECURITY DEFINER trigger;
-- admin/server maintenance remains service_role only.

create or replace function public.handle_new_auth_user_consent_records()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  m jsonb;
  v_role text;
  v_birth_date date;
  v_is_minor boolean := false;
  v_version text;
  v_agreed_at timestamptz := now();
  v_metadata jsonb;
begin
  m := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role := lower(coalesce(nullif(trim(m->>'app_role'), ''), 'student'));
  v_version := coalesce(nullif(trim(m->>'consent_version'), ''), 'legal-placeholder-2026-06-20');

  begin
    v_birth_date := nullif(trim(m->>'birth_date'), '')::date;
  exception when others then
    v_birth_date := null;
  end;

  if v_birth_date is not null then
    v_is_minor := v_birth_date > (current_date - interval '14 years')::date;
  end if;

  v_metadata := jsonb_build_object(
    'role', v_role,
    'birth_date', case when v_birth_date is not null then v_birth_date::text else null end,
    'age_gate_checked_at', nullif(trim(m->>'age_gate_checked_at'), ''),
    'verification_method', coalesce(nullif(trim(m->>'guardian_verification_method'), ''), 'legal_review_pending')
  );

  if (m->>'terms_agreed') = 'true' then
    insert into public.user_consent_records (
      user_id, consent_type, consent_actor, is_minor, guardian_consent,
      consent_version, agreed_at, source, metadata, idempotency_key
    ) values (
      new.id, 'terms', 'user', v_is_minor, false,
      v_version, v_agreed_at, 'signup', v_metadata, 'signup:' || new.id::text || ':terms:' || v_version
    ) on conflict (idempotency_key) do nothing;
  end if;

  if (m->>'privacy_agreed') = 'true' then
    insert into public.user_consent_records (
      user_id, consent_type, consent_actor, is_minor, guardian_consent,
      consent_version, agreed_at, source, metadata, idempotency_key
    ) values (
      new.id, 'privacy', 'user', v_is_minor, false,
      v_version, v_agreed_at, 'signup', v_metadata, 'signup:' || new.id::text || ':privacy:' || v_version
    ) on conflict (idempotency_key) do nothing;
  end if;

  if (m->>'marketing_agreed') = 'true' then
    insert into public.user_consent_records (
      user_id, consent_type, consent_actor, is_minor, guardian_consent,
      consent_version, agreed_at, source, metadata, idempotency_key
    ) values (
      new.id, 'marketing', 'user', v_is_minor, false,
      v_version, v_agreed_at, 'signup', v_metadata, 'signup:' || new.id::text || ':marketing:' || v_version
    ) on conflict (idempotency_key) do nothing;
  end if;

  if v_is_minor and (m->>'guardian_consent') = 'true' then
    insert into public.user_consent_records (
      user_id, consent_type, consent_actor, is_minor, guardian_consent,
      consent_version, guardian_ref, agreed_at, source, metadata, idempotency_key
    ) values (
      new.id, 'minor_guardian_consent', 'guardian', true, true,
      v_version, nullif(trim(m->>'guardian_ref'), ''), v_agreed_at, 'signup', v_metadata,
      'signup:' || new.id::text || ':minor_guardian_consent:' || v_version
    ) on conflict (idempotency_key) do nothing;
  end if;

  return new;
end;
$function$;

comment on function public.handle_new_auth_user_consent_records() is
  'Signup consent ledger trigger. Stores terms/privacy/marketing and under-14 guardian consent skeleton from auth metadata.';

revoke all on function public.handle_new_auth_user_consent_records() from public, anon, authenticated;
grant execute on function public.handle_new_auth_user_consent_records() to service_role;

drop trigger if exists zz_on_auth_user_created_consent_records on auth.users;
create trigger zz_on_auth_user_created_consent_records
  after insert on auth.users
  for each row execute function public.handle_new_auth_user_consent_records();

commit;