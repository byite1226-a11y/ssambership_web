import { permanentRedirect } from "next/navigation";

export default function CommunityPostsRedirectPage() {
  permanentRedirect("/community/board");
}
