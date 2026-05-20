/**
 * public.users 1행에 대응하는 앱용 타입 (1차, 컬럼 늘어나면 동기화)
 */
export type AppRole = "student" | "mentor" | "admin";

export type UserRow = {
  id: string;
  role: AppRole;
  status: string;
  full_name: string | null;
  display_name?: string | null;
  nickname: string | null;
  email: string | null;
  grade_level: string | null;
  student_status: string | null;
  birth_date: string | null;
  terms_agreed_at: string | null;
  privacy_agreed_at: string | null;
  marketing_agreed: boolean;
  created_at: string;
  updated_at: string;
};
