-- 079_b_classification_catalog.sql
-- B: Admin-managed school tier / major category catalogs and school-tier mappings.
-- Apply manually in Supabase SQL Editor after review.
--
-- Safety:
-- - Extends only mentor_school_verifications.school_tier CHECK by adding '건동홍'.
-- - Does not touch mentor_school_verifications RLS, triggers, self-fill guard,
--   verified_major_category CHECK, payments, escrow, or 070 RPCs.

begin;

do $$
declare
  v_constraint_names name[];
  v_constraint_name name;
  v_constraint_def text;
begin
  if to_regclass('public.mentor_school_verifications') is null then
    raise exception 'mentor_school_verifications table does not exist; apply 077 first';
  end if;

  select array_agg(c.conname order by c.conname)
    into v_constraint_names
  from pg_constraint c
  join pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = any(c.conkey)
  where c.conrelid = 'public.mentor_school_verifications'::regclass
    and c.contype = 'c'
    and c.conkey = array[a.attnum]::smallint[]
    and a.attname = 'school_tier'
    and pg_get_constraintdef(c.oid) like '%서연고%'
    and pg_get_constraintdef(c.oid) like '%서성한%'
    and pg_get_constraintdef(c.oid) like '%중경외시%'
    and pg_get_constraintdef(c.oid) like '%그외%'
    and pg_get_constraintdef(c.oid) like '%미분류%';

  if coalesce(array_length(v_constraint_names, 1), 0) <> 1 then
    raise exception
      'expected exactly one school_tier CHECK on mentor_school_verifications, found %: %',
      coalesce(array_length(v_constraint_names, 1), 0),
      coalesce(v_constraint_names::text, '{}');
  end if;

  v_constraint_name := v_constraint_names[1];

  select pg_get_constraintdef(c.oid)
    into v_constraint_def
  from pg_constraint c
  where c.conrelid = 'public.mentor_school_verifications'::regclass
    and c.conname = v_constraint_name;

  raise notice 'Replacing school_tier CHECK %. Old definition: %', v_constraint_name, v_constraint_def;

  execute format(
    'alter table public.mentor_school_verifications drop constraint if exists %I',
    v_constraint_name
  );

  alter table public.mentor_school_verifications
    add constraint mentor_school_verifications_school_tier_check
    check (
      school_tier is null
      or school_tier in (
        '서연고',
        '서성한',
        '중경외시',
        '건동홍',
        '그외',
        '미분류'
      )
    );
end;
$$;

create table if not exists public.school_tier_catalog (
  code text primary key,
  label text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_tier_catalog_code_allowed check (
    code in ('서연고', '서성한', '중경외시', '건동홍', '그외', '미분류')
  ),
  constraint school_tier_catalog_label_nonempty check (char_length(trim(label)) > 0)
);

create table if not exists public.major_category_catalog (
  code text primary key,
  label text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint major_category_catalog_code_allowed check (
    code in ('메디컬', '교육', '인문', '사회상경', '자연', '공학', '예체능', '기타')
  ),
  constraint major_category_catalog_label_nonempty check (char_length(trim(label)) > 0)
);

create table if not exists public.school_tier_mappings (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  school_tier_code text not null references public.school_tier_catalog(code) on update restrict on delete restrict,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_tier_mappings_school_name_nonempty check (char_length(trim(school_name)) > 0)
);

create unique index if not exists school_tier_mappings_school_name_unique
  on public.school_tier_mappings (lower(trim(school_name)));

create index if not exists school_tier_catalog_active_order_idx
  on public.school_tier_catalog (is_active, display_order, code);

create index if not exists major_category_catalog_active_order_idx
  on public.major_category_catalog (is_active, display_order, code);

create index if not exists school_tier_mappings_active_order_idx
  on public.school_tier_mappings (is_active, school_tier_code, school_name);

drop trigger if exists trg_school_tier_catalog_set_updated_at
  on public.school_tier_catalog;
create trigger trg_school_tier_catalog_set_updated_at
  before update on public.school_tier_catalog
  for each row execute function public.set_updated_at();

drop trigger if exists trg_major_category_catalog_set_updated_at
  on public.major_category_catalog;
create trigger trg_major_category_catalog_set_updated_at
  before update on public.major_category_catalog
  for each row execute function public.set_updated_at();

drop trigger if exists trg_school_tier_mappings_set_updated_at
  on public.school_tier_mappings;
create trigger trg_school_tier_mappings_set_updated_at
  before update on public.school_tier_mappings
  for each row execute function public.set_updated_at();

alter table public.school_tier_catalog enable row level security;
alter table public.major_category_catalog enable row level security;
alter table public.school_tier_mappings enable row level security;

drop policy if exists school_tier_catalog_select_active_or_admin
  on public.school_tier_catalog;
create policy school_tier_catalog_select_active_or_admin
  on public.school_tier_catalog
  for select
  to anon, authenticated
  using (is_active = true or coalesce((select public.is_admin()), false) = true);

drop policy if exists major_category_catalog_select_active_or_admin
  on public.major_category_catalog;
create policy major_category_catalog_select_active_or_admin
  on public.major_category_catalog
  for select
  to anon, authenticated
  using (is_active = true or coalesce((select public.is_admin()), false) = true);

drop policy if exists school_tier_catalog_write_admin
  on public.school_tier_catalog;
create policy school_tier_catalog_write_admin
  on public.school_tier_catalog
  for all
  to authenticated
  using (coalesce((select public.is_admin()), false) = true)
  with check (coalesce((select public.is_admin()), false) = true);

drop policy if exists major_category_catalog_write_admin
  on public.major_category_catalog;
create policy major_category_catalog_write_admin
  on public.major_category_catalog
  for all
  to authenticated
  using (coalesce((select public.is_admin()), false) = true)
  with check (coalesce((select public.is_admin()), false) = true);

drop policy if exists school_tier_mappings_admin_all
  on public.school_tier_mappings;
create policy school_tier_mappings_admin_all
  on public.school_tier_mappings
  for all
  to authenticated
  using (coalesce((select public.is_admin()), false) = true)
  with check (coalesce((select public.is_admin()), false) = true);

grant select on public.school_tier_catalog to anon, authenticated;
grant select on public.major_category_catalog to anon, authenticated;
grant select on public.school_tier_mappings to authenticated;

grant insert, update, delete on public.school_tier_catalog to authenticated;
grant insert, update, delete on public.major_category_catalog to authenticated;
grant insert, update, delete on public.school_tier_mappings to authenticated;

insert into public.school_tier_catalog (code, label, display_order, is_active)
values
  ('서연고', '서연고', 1, true),
  ('서성한', '서성한', 2, true),
  ('중경외시', '중경외시', 3, true),
  ('건동홍', '건동홍', 4, true),
  ('그외', '그외', 5, true),
  ('미분류', '미분류', 6, true)
on conflict (code) do nothing;

insert into public.major_category_catalog (code, label, display_order, is_active)
values
  ('메디컬', '메디컬', 1, true),
  ('교육', '교육', 2, true),
  ('인문', '인문', 3, true),
  ('사회상경', '사회상경', 4, true),
  ('자연', '자연', 5, true),
  ('공학', '공학', 6, true),
  ('예체능', '예체능', 7, true),
  ('기타', '기타', 8, true)
on conflict (code) do nothing;

commit;
