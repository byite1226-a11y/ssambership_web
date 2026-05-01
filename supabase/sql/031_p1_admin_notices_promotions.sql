-- P1: 관리자 공지(app_notices) · 프로모션(promotion_campaigns)
-- 선행: 001 public.users (id references auth.users)
-- Idempotent: 여러 번 실행해도 안전
-- RLS: admin만 쓰기; 활성·기간 내 행은 anon/authenticated 조회 가능

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at 전용 트리거 함수 (이 파일에서 정의, set_updated_at에 비의존)
-- ---------------------------------------------------------------------------
create or replace function public.set_admin_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- public.app_notices
-- ---------------------------------------------------------------------------
create table if not exists public.app_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  type text not null default 'notice',
  target text null,
  is_active boolean not null default false,
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_by uuid null references public.users (id) on delete set null,
  updated_by uuid null references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_notices_title_nonempty check (char_length(trim(title)) > 0),
  constraint app_notices_type_allowed check (type in ('notice', 'event', 'maintenance', 'update')),
  constraint app_notices_date_range check (
    starts_at is null or ends_at is null or ends_at >= starts_at
  )
);

create index if not exists app_notices_created_at_idx on public.app_notices (created_at desc);
create index if not exists app_notices_active_window_idx on public.app_notices (is_active, starts_at, ends_at);

drop trigger if exists trg_app_notices_set_updated on public.app_notices;
create trigger trg_app_notices_set_updated
  before update on public.app_notices
  for each row execute function public.set_admin_content_updated_at();

-- ---------------------------------------------------------------------------
-- public.promotion_campaigns
-- ---------------------------------------------------------------------------
create table if not exists public.promotion_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  target text null,
  is_active boolean not null default false,
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_by uuid null references public.users (id) on delete set null,
  updated_by uuid null references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotion_campaigns_title_nonempty check (char_length(trim(title)) > 0),
  constraint promotion_campaigns_date_range check (
    starts_at is null or ends_at is null or ends_at >= starts_at
  )
);

create index if not exists promotion_campaigns_created_at_idx on public.promotion_campaigns (created_at desc);
create index if not exists promotion_campaigns_active_window_idx on public.promotion_campaigns (is_active, starts_at, ends_at);

drop trigger if exists trg_promotion_campaigns_set_updated on public.promotion_campaigns;
create trigger trg_promotion_campaigns_set_updated
  before update on public.promotion_campaigns
  for each row execute function public.set_admin_content_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.app_notices enable row level security;
alter table public.promotion_campaigns enable row level security;

-- app_notices: admin 전체 조회 · 활성+기간 내 공개 조회
drop policy if exists "app_notices_select" on public.app_notices;
create policy "app_notices_select"
  on public.app_notices for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
    or (
      coalesce(is_active, false) = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    )
  );

drop policy if exists "app_notices_insert_admin" on public.app_notices;
create policy "app_notices_insert_admin"
  on public.app_notices for insert
  to authenticated
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

drop policy if exists "app_notices_update_admin" on public.app_notices;
create policy "app_notices_update_admin"
  on public.app_notices for update
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "app_notices_delete_admin" on public.app_notices;
create policy "app_notices_delete_admin"
  on public.app_notices for delete
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- promotion_campaigns
drop policy if exists "promotion_campaigns_select" on public.promotion_campaigns;
create policy "promotion_campaigns_select"
  on public.promotion_campaigns for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
    or (
      coalesce(is_active, false) = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    )
  );

drop policy if exists "promotion_campaigns_insert_admin" on public.promotion_campaigns;
create policy "promotion_campaigns_insert_admin"
  on public.promotion_campaigns for insert
  to authenticated
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

drop policy if exists "promotion_campaigns_update_admin" on public.promotion_campaigns;
create policy "promotion_campaigns_update_admin"
  on public.promotion_campaigns for update
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "promotion_campaigns_delete_admin" on public.promotion_campaigns;
create policy "promotion_campaigns_delete_admin"
  on public.promotion_campaigns for delete
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- ---------------------------------------------------------------------------
-- Grants (RLS와 함께 사용)
-- ---------------------------------------------------------------------------
grant select on public.app_notices to anon, authenticated;
grant select on public.promotion_campaigns to anon, authenticated;
grant insert, update, delete on public.app_notices to authenticated;
grant insert, update, delete on public.promotion_campaigns to authenticated;
