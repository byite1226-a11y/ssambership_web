import "server-only";

import fs from "node:fs";
import path from "node:path";

/**
 * 맞춤의뢰 주문 `status`/`order_status` enum·CHECK 를 레포에 남기면 멘토 작업 시작·상수 정렬이 가능하다.
 * `supabase/sql/001_initial_auth_profile.sql` 에는 users/mentor_profile 만 있고 `custom_request_orders` DDL 없음.
 * Supabase SQL Editor / pg_dump 한 결과를 `002_custom_request_orders_status.sql` 로 커밋한 뒤
 * (CHECK·enum·컬럼이 파일에 있으면) `isCustomRequestOrderStatusDdlInRepo()` 가 true 가 된다.
 */
const DDL_MARKER = path.join(process.cwd(), "supabase", "sql", "002_custom_request_orders_status.sql");

export const MENTOR_START_SCHEMA_GATE_MESSAGE =
  "주문 테이블·상태 정의(DDL)가 레포에 아직 없어 멘토 작업 시작이 비활성화됩니다. supabase/sql/002_custom_request_orders_status.sql(실제 Supabase에서 내보낸 DDL)을 커밋하세요.";

export function isCustomRequestOrderStatusDdlInRepo(): boolean {
  return fs.existsSync(DDL_MARKER);
}

export function getMentorStartDisabledByMissingOrderDdl(): string | null {
  return isCustomRequestOrderStatusDdlInRepo() ? null : MENTOR_START_SCHEMA_GATE_MESSAGE;
}
