import type { MentorsListView } from "@/lib/mentor/mentorsListSearchParams";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";
import { MentorCard } from "@/components/mentor/MentorCard";

export function MentorGrid(props: {
  cards: MentorPublicListCard[];
  favoriteIds: Set<string>;
  isLoggedIn: boolean;
  view?: MentorsListView;
}) {
  const view = props.view ?? "list";

  if (view === "grid") {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
        {props.cards.map((c) => (
          <MentorCard
            key={c.mentorId}
            card={c}
            isLoggedIn={props.isLoggedIn}
            isFavorited={props.favoriteIds.has(c.mentorId)}
            layout="grid"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {props.cards.map((c) => (
        <MentorCard
          key={c.mentorId}
          card={c}
          isLoggedIn={props.isLoggedIn}
          isFavorited={props.favoriteIds.has(c.mentorId)}
          layout="list"
        />
      ))}
    </div>
  );
}
