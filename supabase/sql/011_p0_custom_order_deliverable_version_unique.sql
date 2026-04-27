-- P0: 동일 주문(custom_request_order_id)에 동일 version 의 납품이 2건 이상 생기지 않도록 DB 제약
-- 선행: 003/010( custom_order_deliverables ), 010 Storage
-- idempotent: unique index IF NOT EXISTS
-- [주의] 이미 동일 (custom_request_order_id, version) 이 2행 이상이면 인덱스 생성이 **실패**한다.
--        선행: 아래 "중복 행" 주석 쿼리로 확인 후 수동 병합·정리, 그다음 이 파일 실행.

create unique index if not exists deliverables_order_version_unique
  on public.custom_order_deliverables (custom_request_order_id, version)
  where custom_request_order_id is not null and version is not null;

-- =============================================================================
-- Supabase SQL Editor — 확인용(주석)
-- =============================================================================
-- -- 1) unique index 존재
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'custom_order_deliverables'
--   and indexname = 'deliverables_order_version_unique';
--
-- -- 2) (적용 전) custom_request_order_id+version 중복 행(정리 전 점검)
-- -- select custom_request_order_id, version, count(*)
-- -- from public.custom_order_deliverables
-- -- where custom_request_order_id is not null and version is not null
-- -- group by 1, 2
-- -- having count(*) > 1;
--
-- -- 3) 고아 storage object (DB에 storage_path 가 없는 버킷 객체) — storage_path = name 주의
-- -- select obj.name, obj.id
-- -- from storage.objects obj
-- -- left join public.custom_order_deliverables d
-- --   on d.storage_path = obj.name
-- -- where obj.bucket_id = 'custom-order-deliverables'
-- --   and d.id is null;
-- =============================================================================
