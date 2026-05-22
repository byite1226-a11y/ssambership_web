export type CommunityNavActive =
  | "home"
  | "board"
  | "shortform"
  | "me"
  | "my-posts"
  | "scraps"
  | "follows"
  | "none";

export type CommunityRightAsidePromo = "board" | "shortform" | "home";

export type CommunitySidebarStats = {
  points: number;
  badges: number;
};

export type CommunityPopularMentor = {
  id: string;
  name: string;
  rank: number;
  school?: string | null;
  priceLabel?: string | null;
  subject?: string | null;
};
