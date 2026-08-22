import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchList } from "@/components/match-list";
import type { MatchCardData } from "@/components/match-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      lostMatches: { orderBy: { score: "desc" }, include: { foundItem: true } },
      foundMatches: { orderBy: { score: "desc" }, include: { lostItem: true } },
    },
  });
  if (!item) notFound();

  const matchRows =
    item.reportType === "LOST"
      ? item.lostMatches.map((match) => ({ match, counterpart: match.foundItem }))
      : item.foundMatches.map((match) => ({ match, counterpart: match.lostItem }));

  const matches: MatchCardData[] = matchRows.map(({ match, counterpart }) => ({
    id: match.id,
    score: match.score,
    confidence: match.confidence,
    reasons: Array.isArray(match.reasons) ? (match.reasons as string[]) : [],
    counterpartName: counterpart.name,
    counterpartType: counterpart.reportType,
    counterpartLocation: counterpart.location,
    counterpartDate: counterpart.dateAndTime,
    counterpartDescription: counterpart.description,
  }));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <p className="mb-6">
        <Link href="/" className="text-sm underline underline-offset-4">
          ← Back to dashboard
        </Link>
      </p>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardDescription className="text-xs font-medium tracking-wide uppercase">
                Original report
              </CardDescription>
              <CardTitle className="mt-1 text-xl">{item.name}</CardTitle>
            </div>
            <Badge variant={item.reportType === "LOST" ? "destructive" : "secondary"}>
              {item.reportType}
            </Badge>
          </div>
          <CardDescription>
            {[item.category, item.location].filter(Boolean).join(" • ")} •{" "}
            {item.dateAndTime.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-medium tracking-tight">
          Potential Matches{" "}
          <span className="font-normal text-muted-foreground">
            ({matches.length})
          </span>
        </h2>

        {matches.length === 0 ? (
          <p className="text-muted-foreground">
            No potential matches found. Check back later — matches are generated
            whenever a new opposite report is submitted.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Ranked by match score. Every reason that contributed to the score
              is listed on the card.
            </p>
            <MatchList matches={matches} />
          </>
        )}
      </section>
    </main>
  );
}
