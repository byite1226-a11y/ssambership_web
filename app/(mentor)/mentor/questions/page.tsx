import { redirect } from "next/navigation";

export default function LegacyMentorQuestionsRedirect() {
  redirect("/mentor/question-room");
}
