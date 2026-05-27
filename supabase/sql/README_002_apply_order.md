# 002번 SQL 중복 번호 — 적용 순서 정리

접두 `002`가 세 파일에 공유됩니다. **파일명 알파벳 순(app → custom → p0)은 프로덕션 적용 순서가 아닙니다.**

선행 공통: `001_initial_auth_profile.sql`

## 한 줄 요약

| 파일 | 요약 |
|------|------|
| `002_app_core_schema_draft.sql` | 전체 도메인 인벤토리 초안(DRAFT). payments·맞춤의뢰·구독·Q&A·캐시·분쟁 등 다수 `CREATE TABLE` — **프로덕션 직접 적용 금지**, `002_p0`와 테이블 중복 |
| `002_custom_request_orders_status.sql` | `select 1` 마커만. `orderSchemaGate`·E2E용 — 실제 DDL은 `003_p0_custom_request_draft.sql` |
| `002_p0_subscriptions_questions_draft.sql` | P0 구독·결제 intent·`mentor_student_rooms`·질문방·알림 DDL + RLS — **002 계열 중 실제 적용 대상** |

## 테이블 생성·의존 기준 권장 적용 순서

| 순서 | 파일 | 근거 |
|------|------|------|
| 1 | `002_p0_subscriptions_questions_draft.sql` | `payments` → `subscriptions` → `mentor_student_rooms` → `question_threads` / `question_messages` / `connection_notes` / `notifications` FK 체인. `001.users` 직후 P0 코어 |
| 2 | `003_p0_custom_request_draft.sql` *(002 아님)* | `custom_request_orders` 등 맞춤의뢰 DDL — `002_custom`의 실제 스키마 출처 |
| 3 | `002_custom_request_orders_status.sql` | DDL 없음. `003` 적용 후 마커(`select 1`)로 앱 `orderSchemaGate` 활성화 |
| — | `002_app_core_schema_draft.sql` | `002_p0`·`003`과 **동시 적용하지 않음**. 참고·검토용 인벤토리 |

### 현재 알파벳 순 vs 권장 순

| 알파벳 순 (파일시스템) | 권장 순 |
|------------------------|---------|
| 1. `002_app_core_schema_draft` | 3. *(적용 안 함 / 참고만)* |
| 2. `002_custom_request_orders_status` | 2. `003` 이후 마커 |
| 3. `002_p0_subscriptions_questions_draft` | 1. P0 코어 |

## 파일명 재정렬 제안 (적용 이력 확인 후에만 변경)

Supabase에 이미 적용된 번호를 바꾸면 혼란이 생기므로, **DB 적용 이력을 확인한 뒤** 아래처럼 접두만 붙이는 것을 권장합니다.

| 현재 파일명 | 제안 파일명 | 역할 |
|-------------|-------------|------|
| `002_p0_subscriptions_questions_draft.sql` | `002a_p0_subscriptions_questions_draft.sql` | 1순위 P0 적용 |
| `002_custom_request_orders_status.sql` | `002b_custom_request_orders_status.sql` | `003` 이후 마커 |
| `002_app_core_schema_draft.sql` | `002c_app_core_schema_draft.sql` | 참고용 DRAFT (미적용) |

## `999_dummy_data.sql`

UI 검증용 데모 INSERT 전용이었으며 저장소에서 제거됨. 로컬 시드가 필요하면 Auth 계정 생성 후 별도 시드 스크립트로 관리하세요.
