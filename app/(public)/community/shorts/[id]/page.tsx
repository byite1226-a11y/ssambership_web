import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CommunityShortsDetailRedirectPage(props: Props) {
  const { id } = await props.params;
  permanentRedirect(`/community/shortform/${id}`);
}
