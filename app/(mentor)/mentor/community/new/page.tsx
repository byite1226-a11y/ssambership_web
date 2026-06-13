import { redirect } from "next/navigation";
import { communityComposePath } from "@/lib/community/communityComposeTab";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** 드롭다운 작성 화면 → 분리된 작성 경로로 redirect */
export default async function MentorCommunityNewPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const tab = sp.tab === "shortform" ? "shortform" : "board";
  const draftId = typeof sp.draftId === "string" ? sp.draftId : undefined;
  redirect(communityComposePath(tab, draftId ? { draftId } : undefined));
}
