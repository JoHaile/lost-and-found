export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
  { value: "match", label: "Best match" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];
