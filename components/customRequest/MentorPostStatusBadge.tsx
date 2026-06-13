import { StatusBadge, type DsStatusTone } from "@/components/design-system";
import {
  mentorPostStatusLabelForUi,
  mentorPostStatusToken,
  mentorPostStatusUiTone,
  type MentorPostStatusUiTone,
} from "@/lib/customRequest/mentorCustomRequestDisplay";

const POST_TONE_TO_DS: Record<MentorPostStatusUiTone, DsStatusTone> = {
  blue: "info",
  green: "success",
  gray: "neutral",
  amber: "warning",
};

type Row = Record<string, unknown>;

export function MentorPostStatusBadge({ row }: { row: Row }) {
  const t = mentorPostStatusToken(row);
  const label = mentorPostStatusLabelForUi(t);
  const tone = mentorPostStatusUiTone(t);
  return <StatusBadge label={label} tone={POST_TONE_TO_DS[tone]} size="sm" />;
}
