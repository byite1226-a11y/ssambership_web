"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth/getCurrentUser";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { COMMUNITY_BRAND_MENTOR_LABEL } from "@/lib/community/communityAuthorLabels";
import { communityComposePath } from "@/lib/community/communityComposeTab";
import { insertShortformPost, updateShortformPost } from "@/lib/community/communityShortformMutations";
import type { ShortformCategorySlug } from "@/lib/community/communityShortformConstants";
import { uploadShortformVideo } from "@/lib/community/communityShortformStorage";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function err(path: string, code: string): never {
  redirect(`${path}?error=${encodeURIComponent(code)}`);
}

export async function submitShortformUploadAction(formData: FormData) {
  const returnPath = communityComposePath("shortform");
  const { user } = await getServerAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnPath)}`);

  const supabase = await createClient();
  const { data: profile } = await getUserProfileById(supabase, user.id);
  if (profile?.role !== "mentor") redirect("/community/shortform?error=mentor_only");

  const intent = String(formData.get("intent") ?? "publish");
  const status = intent === "draft" ? "draft" : "published";
  const draftId = String(formData.get("draftId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "study") as ShortformCategorySlug;
  const body = String(formData.get("body") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const rights = formData.get("rightsAck") === "on";

  if (!rights && status === "published") err(returnPath, "rights");
  if (!title) err(returnPath, "title");

  const videoFile = formData.get("video");
  let videoUrl = String(formData.get("videoUrl") ?? "").trim();
  if (videoFile instanceof File && videoFile.size > 0) {
    const buf = Buffer.from(await videoFile.arrayBuffer());
    const up = await uploadShortformVideo(supabase, user.id, buf, videoFile.type || "video/mp4");
    if (up.error) err(returnPath, up.error === "size" ? "video_size" : "video_upload");
    videoUrl = up.url ?? "";
  }
  if (!videoUrl && status === "published") err(returnPath, "video");

  const label = profile?.nickname?.trim() || profile?.full_name?.trim() || COMMUNITY_BRAND_MENTOR_LABEL;
  const payload = {
    title,
    category,
    videoUrl,
    thumbnailUrl: null as string | null,
    body,
    tags: [] as string[],
    source,
    status: status as "draft" | "published",
    authorLabel: label,
  };

  const r =
    draftId && UUID_RE.test(draftId)
      ? await updateShortformPost(supabase, user.id, draftId, payload)
      : await insertShortformPost(supabase, user.id, payload);

  if (!r.ok) {
    err(returnPath, r.error);
  }

  revalidatePath("/community/shortform");
  revalidatePath("/community");
  revalidatePath("/community/me");

  if (status === "published") redirect(`/community/shortform/${r.id}`);
  redirect(communityComposePath("shortform", { draft: "1", draftId: r.id }));
}
