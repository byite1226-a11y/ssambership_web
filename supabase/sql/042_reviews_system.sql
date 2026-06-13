-- 멘토 리뷰 (학생 작성, 멘토 답글 1회, 관리자 숨김)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles (user_id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  subscription_count integer not null,
  rating integer not null check (rating between 1 and 5),
  content text not null,
  mentor_reply text,
  mentor_replied_at timestamptz,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint reviews_one_per_pair unique (mentor_id, student_id)
);

create index if not exists idx_reviews_mentor_created on public.reviews (mentor_id, created_at desc);
create index if not exists idx_reviews_student on public.reviews (student_id);

alter table public.reviews enable row level security;

-- 공개 읽기: 숨김 제외 (본인·멘토·관리자는 숨김 포함 조회)
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public" on public.reviews
  for select
  using (
    is_hidden = false
    or (select auth.uid()) = student_id
    or (select auth.uid()) = mentor_id
    or exists (
      select 1 from public.users u
      where u.id = (select auth.uid()) and u.role = 'admin'
    )
  );

-- 학생 작성 (자격은 서버/API에서 검증)
drop policy if exists "reviews_insert_student" on public.reviews;
create policy "reviews_insert_student" on public.reviews
  for insert to authenticated
  with check ((select auth.uid()) = student_id);

-- 멘토 답글 (본인 리뷰에만)
drop policy if exists "reviews_update_mentor_reply" on public.reviews;
create policy "reviews_update_mentor_reply" on public.reviews
  for update to authenticated
  using ((select auth.uid()) = mentor_id)
  with check ((select auth.uid()) = mentor_id);

-- 관리자 숨김/복구
drop policy if exists "reviews_admin_moderate" on public.reviews;
create policy "reviews_admin_moderate" on public.reviews
  for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid()) and u.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid()) and u.role = 'admin'
    )
  );

comment on table public.reviews is '멘토 리뷰: 동일 멘토 2회+ 구독 학생만 작성, 수정 불가, 멘토 답글 1회';
