import { redirect } from "next/navigation";

// 연결노트 실기능은 질문방(QuestionRoomWorkspace 내 ConnectionNotesPanel)에 통합되어 있습니다.
// 독립 통합뷰는 미구현이므로 질문방으로 보냅니다(북마크·구 링크 대비 redirect).
export default function StudentNotesPage() {
  redirect("/question-room");
}
