import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function LegacyMentorQuestionRoomRedirect(props: Props) {
  const { roomId } = await props.params;
  redirect(`/mentor/question-room/${roomId}`);
}
