import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function LegacyStudentQuestionRoomRedirect(props: Props) {
  const { roomId } = await props.params;
  redirect(`/question-room/${roomId}`);
}
