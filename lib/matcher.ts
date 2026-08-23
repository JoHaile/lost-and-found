import type { Item } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { extractItemName, textSimilarity, tokenOverlap } from "@/lib/nlp";

const WEIGHTS = {
  category: 25,
  name: 25,
  location: 20,
  date: 15,
  color: 10,
  nlp: 5,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_WINDOW_DAYS = 30;
const MATCH_THRESHOLD = 50;

export interface MatchResult {
  score: number;
  confidence: string;
  reasons: string[];
}

type ScorePart = { points: number; reason?: string };

function calculateCategoryScore(lost: Item, found: Item): ScorePart {
  if (!lost.category || !found.category) return { points: 0 };

  if (lost.category.trim().toLowerCase() === found.category.trim().toLowerCase()) {
    return { points: WEIGHTS.category, reason: "Same category" };
  }

  const similarity = Math.max(
    textSimilarity(lost.category, found.category),
    tokenOverlap(lost.category, found.category),
  );
  if (similarity < 0.6) return { points: 0 };
  return {
    points: Math.round(WEIGHTS.category * similarity),
    reason: "Similar category",
  };
}

function calculateNameScore(lost: Item, found: Item): ScorePart {
  let lostName = extractItemName(lost.name, [lost.color, lost.location]);
  let foundName = extractItemName(found.name, [found.color, found.location]);
  if (!lostName || !foundName) {
    lostName = lost.name;
    foundName = found.name;
  }

  const similarity = Math.max(
    textSimilarity(lostName, foundName),
    tokenOverlap(lostName, foundName),
  );
  if (similarity < 0.6) return { points: 0 };
  return {
    points: Math.round(WEIGHTS.name * similarity),
    reason: "Similar item name",
  };
}

function calculateLocationScore(lost: Item, found: Item): ScorePart {
  const similarity = textSimilarity(lost.location, found.location);
  if (similarity >= 1) {
    return { points: WEIGHTS.location, reason: "Same location" };
  }
  if (similarity >= 0.8) {
    return {
      points: Math.round(WEIGHTS.location * similarity),
      reason: "Similar location",
    };
  }
  return { points: 0 };
}

function calculateDateScore(lost: Item, found: Item): ScorePart {
  const gapDays =
    Math.abs(found.dateAndTime.getTime() - lost.dateAndTime.getTime()) / DAY_MS;
  const points = Math.max(
    0,
    Math.round(WEIGHTS.date * (1 - gapDays / DATE_WINDOW_DAYS)),
  );

  const dayDiff = Math.round(
    (found.dateAndTime.getTime() - lost.dateAndTime.getTime()) / DAY_MS,
  );
  let reason: string;
  if (Math.abs(dayDiff) <= 1) {
    reason = "Found on the same or next day";
  } else if (dayDiff > 1) {
    reason = `Found ${dayDiff} days after the item was reported lost`;
  } else {
    reason = `Found ${-dayDiff} days before the item was reported lost`;
  }

  return points === 0 ? { points: 0 } : { points, reason };
}

function calculateColorScore(lost: Item, found: Item): ScorePart {
  if (!lost.color || !found.color) return { points: 0 };
  const similarity = textSimilarity(lost.color, found.color);
  if (similarity < 0.75) return { points: 0 };
  return {
    points: Math.round(WEIGHTS.color * similarity),
    reason: similarity >= 1 ? "Same color" : "Similar color",
  };
}

function calculateNlpScore(lost: Item, found: Item): ScorePart {
  const overlap = tokenOverlap(lost.description, found.description);
  if (overlap < 0.15) return { points: 0 };
  return {
    points: Math.round(WEIGHTS.nlp * overlap),
    reason: "Descriptions share similar keywords",
  };
}

export function getConfidence(score: number): string {
  if (score >= 75) return "Strong Match";
  if (score >= 50) return "Possible Match";
  return "Weak Match";
}

export function calculateMatchScore(lost: Item, found: Item): MatchResult {
  const parts = [
    calculateCategoryScore(lost, found),
    calculateNameScore(lost, found),
    calculateLocationScore(lost, found),
    calculateDateScore(lost, found),
    calculateColorScore(lost, found),
    calculateNlpScore(lost, found),
  ];

  const score = parts.reduce((total, part) => total + part.points, 0);
  const reasons = parts
    .map((part) => part.reason)
    .filter((reason): reason is string => reason !== undefined);

  return { score, confidence: getConfidence(score), reasons };
}

export async function findAndSaveMatches(item: Item): Promise<number> {
  const oppositeType = item.reportType === "LOST" ? "FOUND" : "LOST";
  const windowStart = new Date(item.dateAndTime.getTime() - DATE_WINDOW_DAYS * DAY_MS);
  const windowEnd = new Date(item.dateAndTime.getTime() + DATE_WINDOW_DAYS * DAY_MS);

  const candidates = await prisma.item.findMany({
    where: {
      reportType: oppositeType,
      status: "PENDING",
      dateAndTime: { gte: windowStart, lte: windowEnd },
    },
  });

  let saved = 0;
  for (const candidate of candidates) {
    const result =
      item.reportType === "LOST"
        ? calculateMatchScore(item, candidate)
        : calculateMatchScore(candidate, item);

    if (result.score < MATCH_THRESHOLD) continue;

    const lostItemId = item.reportType === "LOST" ? item.id : candidate.id;
    const foundItemId = item.reportType === "LOST" ? candidate.id : item.id;

    await prisma.match.upsert({
      where: { lostItemId_foundItemId: { lostItemId, foundItemId } },
      update: {
        score: result.score,
        confidence: result.confidence,
        reasons: result.reasons,
      },
      create: {
        lostItemId,
        foundItemId,
        score: result.score,
        confidence: result.confidence,
        reasons: result.reasons,
      },
    });
    saved++;
  }
  return saved;
}
