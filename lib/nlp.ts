import natural from "natural";

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "in",
  "on",
  "at",
  "to",
  "with",
  "for",
  "is",
  "it",
  "was",
  "my",
  "i",
]);

export function tokenize(text: string): string[] {
  return (tokenizer.tokenize(text.toLowerCase()) ?? [])
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map((token) => stemmer.stem(token));
}

export function textSimilarity(a: string, b: string): number {
  return natural.JaroWinklerDistance(a.trim().toLowerCase(), b.trim().toLowerCase());
}

export function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let shared = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) shared++;
  }
  return shared / (tokensA.size + tokensB.size - shared);
}
