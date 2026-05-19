import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";
import { MentorCard } from "@/components/mentor/MentorCard";

export function MentorGrid(props: {
  cards: MentorPublicListCard[];
  favoriteIds: Set<string>;
  isLoggedIn: boolean;
}) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {props.cards.map((c) => (
        <MentorCard
          key={c.mentorId}
          card={c}
          isLoggedIn={props.isLoggedIn}
          isFavorited={props.favoriteIds.has(c.mentorId)}
        />
      ))}
    </div>
  );
}
