import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";
import { MentorCard } from "@/components/mentor/MentorCard";

export function MentorGrid(props: { cards: MentorPublicListCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {props.cards.map((c) => (
        <MentorCard key={c.mentorId} card={c} />
      ))}
    </div>
  );
}
