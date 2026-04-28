-- 커뮤니티 게시판/숏폼 공용 댓글 (post_type + post_id로 글을 가리킴, FK는 게시글 테이블에 직접 연결하지 않음)
-- 선행: 001(확장 pgcrypto, public.set_updated_at)
-- v1 RLS: SELECT(visible) + INSERT(로그인·본인)만. UPDATE/DELETE/관리자는 추후(서비스 롤·별도 SQL).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) 테이블
-- ---------------------------------------------------------------------------
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_type text not null
    check (post_type in ('board', 'shortform')),
  post_id uuid not null,
  author_id uuid not null references auth.users (id) on delete cascade,
  -- RLS로 타인 public.users 를 읽기 어려울 수 있어, 등록 시 표시용 스냅샷만 저장
  author_label text not null default '쌤버십 회원',
  body text not null,
  status text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_comments_status_chk check (status in ('visible', 'hidden')),
  constraint community_comments_body_len_chk
    check (char_length(trim(body)) between 1 and 1000)
);

create index if not exists community_comments_post_list_idx
  on public.community_comments (post_type, post_id, created_at asc);
create index if not exists community_comments_author_idx
  on public.community_comments (author_id);

drop trigger if exists trg_community_comments_set_updated on public.community_comments;
create trigger trg_community_comments_set_updated
  before update on public.community_comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) RLS
-- ---------------------------------------------------------------------------
alter table public.community_comments enable row level security;

-- 읽기: visible 만 (anon 포함)
drop policy if exists "community_comments_select_visible" on public.community_comments;
create policy "community_comments_select_visible"
  on public.community_comments
  for select
  to anon, authenticated
  using (status = 'visible');

-- 쓰기: 로그인, 본인을 author_id 로, body 길이·post_type 는 테이블 check 와 RLS로 이중 맞춤
drop policy if exists "community_comments_insert_authenticated" on public.community_comments;
create policy "community_comments_insert_authenticated"
  on public.community_comments
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and (select auth.uid()) is not null
    and char_length(trim(body)) between 1 and 1000
  );

-- ---------------------------------------------------------------------------
-- 3) 확인용 (Supabase SQL Editor; 주석)
-- select id, post_type, post_id, left(body, 30), author_label, status, created_at
-- from public.community_comments
-- order by created_at desc
-- limit 5;
