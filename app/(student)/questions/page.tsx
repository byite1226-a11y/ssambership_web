import { redirect } from "next/navigation";

export default function LegacyStudentQuestionsRedirect() {
  redirect("/question-room");
}
