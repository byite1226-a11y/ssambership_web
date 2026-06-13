-- [의존 순서] 이 파일은 003_p0_custom_request_draft.sql 이후 적용할 것
-- [번호 충돌] 접두 039 — 동일 번호: 039_storage_buckets_private_audit.sql (이 파일: 맞춤의뢰 컬럼 호환)
-- 맞춤의뢰 스키마 호환 (003 선행). 앱 v2 필드 보강.
-- 기존 003 테이블이 있으면 컬럼만 추가, 없으면 003 먼저 적용.

create extension if not exists pgcrypto;

alter table if exists public.custom_request_posts
  add column if not exists file_urls text[] not null default '{}',
  add column if not exists budget_min int,
  add column if not exists budget_max int;

alter table if exists public.custom_request_applications
  add column if not exists estimated_days int,
  add column if not exists portfolio_urls text[] not null default '{}';

alter table if exists public.custom_order_deliverables
  add column if not exists file_name text,
  add column if not exists version int not null default 1;

comment on column public.custom_request_posts.file_urls is '의뢰 등록 첨부 public URL 배열(레거시 호환)';
