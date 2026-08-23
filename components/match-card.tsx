import { CheckCircle2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MatchCardData {
  id: string;
  score: number;
  confidence: string;
  reasons: string[];
  counterpartName: string;
  counterpartType: "LOST" | "FOUND";
  counterpartLocation: string;
  counterpartDate: Date;
  counterpartDescription: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function confidenceTone(score: number): { badge: string; bar: string } {
  if (score >= 75)
    return { badge: "bg-emerald-600 text-white", bar: "bg-emerald-500" };
  if (score >= 50)
    return {
      badge:
        "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      bar: "bg-amber-500",
    };
  return {
    badge: "bg-muted text-muted-foreground",
    bar: "bg-muted-foreground/40",
  };
}

export function MatchCard({ match }: { match: MatchCardData }) {
  const tone = confidenceTone(match.score);

  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            {match.counterpartName}
          </CardTitle>
          <Badge
            variant={
              match.counterpartType === "LOST" ? "destructive" : "success"
            }
            className="shrink-0"
          >
            {match.counterpartType}
          </Badge>
        </div>
        <CardDescription>
          {match.counterpartLocation} • {formatDate(match.counterpartDate)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {match.counterpartDescription}
        </p>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {Math.round(match.score)}
              <span className="text-lg text-muted-foreground">%</span>
            </span>
            <Badge className={cn("border-transparent", tone.badge)}>
              {match.confidence}
            </Badge>
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                tone.bar,
              )}
              style={{ width: `${Math.min(100, Math.max(4, match.score))}%` }}
            />
          </div>
        </div>

        {match.reasons.length > 0 && (
          <ul className="grid gap-1.5">
            {match.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
