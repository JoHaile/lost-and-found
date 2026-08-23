import Link from "next/link";
import { CalendarIcon, MapPinIcon, TagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ReportCardData {
  id: string;
  name: string;
  location: string;
  category: string | null;
  dateAndTime: Date;
  reportType: "LOST" | "FOUND";
  bestScore: number | null;
  bestConfidence: string | null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReportList({ reports }: { reports: ReportCardData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <Card
          key={report.id}
          className="flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-snug">
                {report.name}
              </CardTitle>
              <Badge
                variant={
                  report.reportType === "LOST" ? "destructive" : "success"
                }
                className="shrink-0"
              >
                {report.reportType}
              </Badge>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {report.category && (
                <span className="inline-flex items-center gap-1.5">
                  <TagIcon className="size-3.5 text-muted-foreground" />
                  {report.category}
                </span>
              )}
              {report.category && report.location && (
                <span className="text-muted-foreground/60">•</span>
              )}
              {report.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon className="size-3.5 text-muted-foreground" />
                  {report.location}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarIcon className="size-3.5" />
              {formatDate(report.dateAndTime)}
            </p>
            {report.bestScore !== null && (
              <div className="mt-3 rounded-lg border p-3 transition-colors group-hover:bg-muted/40">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Best Match
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-xl font-semibold tracking-tight tabular-nums">
                    {Math.round(report.bestScore)}%
                  </span>
                  {report.bestConfidence && (
                    <Badge
                      variant="outline"
                      className={cn(
                        report.bestScore >= 75 &&
                          "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
                        report.bestScore < 75 &&
                          report.bestScore >= 50 &&
                          "border-amber-500/30 text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {report.bestConfidence}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      report.bestScore >= 75
                        ? "bg-emerald-500"
                        : report.bestScore >= 50
                          ? "bg-amber-500"
                          : "bg-primary/60",
                    )}
                    style={{
                      width: `${Math.min(100, Math.max(4, report.bestScore))}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="default" className="w-full">
              <Link
                href={`/matches/${report.id}`}
                className={
                  "w-full text-center flex justify-center items-center"
                }
              >
                View Matches
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
