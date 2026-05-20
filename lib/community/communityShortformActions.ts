"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth/getCurrentUser";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import type { ShortformCategorySlug } from "@/lib/community/communityShortformConstants";
import { insertShortformPost } from "@/lib/community/communityShortformMutations";
import { uploadShortformThumbnail, uploadShortformVideo } from "@/lib/community/communityShortformStorage";

const NEW = "/community/shortform/new";

function err(path: string, code: string): never {
  redirect(`${path}?error=${encodeURIComponent(code)}`);
}

export async function submitShortformUploadAction(formData: FormData) {
  const { user } = await getServerAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(NEW)}`);

  const supabase = await createClient();
  const { data: profile } = await getUserProfileById(supabase, user.id);
  if (profile?.role !== "mentor") redirect("/community/shortform?error=mentor_only");

  const intent = String(formData.get("intent") ?? "publish");
  const status = intent === "draft" ? "draft" : "published";
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "study") as ShortformCategorySlug;
  const body = String(formData.get("body") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(/[,\s#]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);
  const rights = formData.get("rightsAck") === "on";

  if (!rights) err(NEW, "rights");
  if (!title) err(NEW, "title");

  const videoFile = formData.get("video");
  let videoUrl = String(formData.get("videoUrl") ?? "").trim();
  if (videoFile instanceof File && videoFile.size > 0) {
    const buf = Buffer.from(await videoFile.arrayBuffer());
    const up = await uploadShortformVideo(supabase, user.id, buf, videoFile.type || "video/mp4");
    if (up.error) err(NEW, up.error === "size" ? "video_size" : "video_upload");
    videoUrl = up.url ?? "";
  }
  if (!videoUrl && status === "published") err(NEW, "video");

  let thumbnailUrl: string | null = null;
  const thumbFile = formData.get("thumbnail");
  if (thumbFile instanceof File && thumbFile.size > 0) {
    const buf = Buffer.from(await thumbFile.arrayBuffer());
    const up = await uploadShortformThumbnail(supabase, user.id, buf, thumbFile.type || "image/jpeg");
    if (!up.error) thumbnailUrl = up.url;
  }

  const label = profile?.nickname?.trim() || profile?.full_name?.trim() || "\uC258\uBC84\uC2ED \uBA58\uD1A0";
  const r = await insertShortformPost(supabase, user.id, {
    title,
    category,
    videoUrl,
    thumbnailUrl,
    body,
    tags,
    source,
    status,
    authorLabel: label,
  });

  if (!r.ok) {
    err(NEW, r.error);
  }

  revalidatePath("/community/shortform");
  revalidatePath("/community");
  if (status === "published") redirect(`/community/shortform/${r.id}`);
  redirect(`${NEW}?draft=1`);
}
