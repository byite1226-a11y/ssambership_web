import { permanentRedirect } from "next/navigation";

export default function CommunityWriteRedirectPage() {
  permanentRedirect("/community/new");
}
