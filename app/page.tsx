import Link from "next/link";
import { InboxIcon, SearchXIcon } from "lucide-react";
import { ReportList, type ReportCardData } from "@/components/report-list";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = q?.trim();

  const [items, lostCount, foundCount, matchCount] = await Promise.all([
    prisma.item.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { color: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 24,
      include: { lostMatches: true, foundMatches: true },
    }),
    prisma.item.count({ where: { reportType: "LOST" } }),
    prisma.item.count({ where: { reportType: "FOUND" } }),
    prisma.match.count(),
  ]);

  const reports: ReportCardData[] = items.map((item) => {
    const allMatches = [...item.lostMatches, ...item.foundMatches];
    const best =
      allMatches.length > 0
        ? allMatches.reduce((top, match) =>
            match.score > top.score ? match : top,
          )
        : null;
    return {
      id: item.id,
      name: item.name,
      location: item.location,
      category: item.category,
      dateAndTime: item.dateAndTime,
      reportType: item.reportType,
      bestScore: best?.score ?? null,
      bestConfidence: best?.confidence ?? null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-wrap gap-2">
          <Badge variant="destructive">{lostCount} lost</Badge>
          <Badge variant="secondary">{foundCount} found</Badge>
          <Badge variant="outline">{matchCount} matches</Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold tracking-tight text-balance">
              Lost &amp; Found Matcher
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
              Lost something on campus? Found something that is not yours?
              Submit a report and we will surface potential matches between lost
              and found reports — each with a score and clear reasons.
            </p>
          </div>
          <Link href="/report" className={buttonVariants({ size: "lg", className: "rounded-full px-5 shadow-sm" })}>
            Report an Item
          </Link>
        </div>

        <form action="/" className="mt-8 flex max-w-md gap-2">
          <Input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search reports by name, description, location…"
            aria-label="Search reports"
            className="h-9 rounded-full bg-card pl-4 shadow-sm"
          />
          <Button type="submit" variant="outline" className="rounded-full">
            Search
          </Button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-medium tracking-tight">Recent Reports</h2>

        {reports.length === 0 && search ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-center animate-in fade-in duration-500">
            <SearchXIcon className="size-8 text-muted-foreground/60" />
            <p className="font-medium">No reports match your search</p>
            <p className="text-sm text-muted-foreground">
              Try different keywords, or clear the search to see everything.
            </p>
          </div>
        ) : reports.length === 0 ? (
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <InboxIcon className="size-8 text-muted-foreground/60" />
              <div>
                <CardTitle>No reports yet</CardTitle>
                <CardDescription className="mt-1">
                  Be the first to submit a report. Matches appear automatically
                  as reports come in.
                </CardDescription>
              </div>
              <Link href="/report" className={buttonVariants({ className: "mt-2 rounded-full px-5" })}>
                Submit the first report
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ReportList reports={reports} />
        )}
      </section>
    </main>
  );
}
