import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";
import { MentorCard } from "@/components/mentor/MentorCard";

export function MentorGrid(props: { cards: MentorPublicListCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
      {props.cards.map((c) => (
        <MentorCard key={c.mentorId} card={c} />
      ))}
    </div>
  );
}
