-- 멘토 정산 계좌 (마스킹 표시용)
alter table public.mentor_profiles
  add column if not exists payout_bank_name text,
  add column if not exists payout_account_number text;

comment on column public.mentor_profiles.payout_bank_name is '정산 입금 은행명';
comment on column public.mentor_profiles.payout_account_number is '정산 입금 계좌번호(서버 저장, UI 마스킹)';
