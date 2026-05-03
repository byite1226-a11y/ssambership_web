import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";
import { MentorCard } from "@/components/mentor/MentorCard";

export function MentorGrid(props: { cards: MentorPublicListCard[] }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 sm:gap-6">
      {props.cards.map((c) => (
        <MentorCard key={c.mentorId} card={c} />
      ))}
    </div>
  );
}
