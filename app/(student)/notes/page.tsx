import { PageScaffold } from "@/components/shell/PageScaffold";

export default function StudentNotesPage() {
  return (
    <PageScaffold
      eyebrow="Student / Notes"
      title="연결 노트"
      description="질문방 메시지와 분리된 학습용 노트 저장소입니다. room/thread 흐름과 별개로 관리합니다."
      ctas={[
        { href: "/question-room", label: "질문방으로 이동", tone: "slate" },
        { href: "/subscriptions", label: "구독 상태 확인", tone: "blue" },
      ]}
      sections={[
        { title: "노트 리스트", body: "connection_notes를 room/thread 기준으로 그룹화.", status: "skeleton" },
        { title: "멘토 피드백 영역", body: "멘토가 남긴 액션 아이템 블록.", status: "skeleton" },
        { title: "즐겨찾기/보관", body: "복습을 위한 핀/태그 자리.", status: "skeleton" },
        { title: "알림 연동", body: "노트 변경 시 notifications 생성.", status: "skeleton" },
      ]}
      emptyState="노트가 없으면 질문방 답변 후 자동 생성될 예정임을 안내합니다."
      dataPoints={["connection_notes", "mentor_student_rooms", "notifications"]}
    />
  );
}
