import type { MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { MentorPublicProfilePreviewCard } from "@/components/mentor/MentorPublicProfilePreviewCard";

type MentorProfileHubPreviewProps = MentorProfileDisplay & {
  mediaCount: number;
  byTier?: Record<string, Record<string, unknown> | null> | null;
};

export function MentorProfileHubPreview(props: MentorProfileHubPreviewProps) {
  const { mediaCount, byTier, ...display } = props;
  return (
    <MentorPublicProfilePreviewCard
      variant="hub"
      display={display}
      stats={{ mediaCount, byTier }}
      footerNote="공개 프로필과 동일한 요약 미리보기입니다."
    />
  );
}
