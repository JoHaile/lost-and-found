import { MatchCard, type MatchCardData } from "@/components/match-card";

export function MatchList({ matches }: { matches: MatchCardData[] }) {
  return (
    <div className="grid animate-in fade-in slide-in-from-bottom-2 gap-4 duration-500 md:grid-cols-2">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
