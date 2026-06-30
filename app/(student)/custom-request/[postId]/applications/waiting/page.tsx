import { redirect } from "next/navigation";

/**
 * 지원 대기/비교·선정 화면은 `/custom-request/[postId]/applications` 하나로 통합.
 * (지원 0건이면 대기 안내, 1건 이상이면 비교·선정 — 한 화면에서 자동 분기)
 * 기존 딥링크·알림 호환을 위해 redirect 유지.
 */
export default async function CustomRequestApplicationsWaitingRedirect(props: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await props.params;
  redirect(`/custom-request/${encodeURIComponent(postId)}/applications`);
}
