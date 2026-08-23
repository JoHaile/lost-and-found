# How the Website Works — Code Structure Guide

Reference for the app's architecture and every function in `lib/`.
Pair this with the high-level overview in the root `README.md`.

---

## 1. The Big Picture

Lost & Found Matcher is a Next.js App Router application. Users submit **LOST** or **FOUND**
reports for items; on submission the system scans opposite-type reports and saves
**explainable matches** (score + confidence + reasons).

```
Browser                        Server                              Database
-------                        ------                              --------
/  dashboard ──────────────►  app/page.tsx (RSC) ───────────────► prisma.item / prisma.match
      │                        • reads searchParams.q
      │                        • renders stat chips + cards
      │
/report form ───────────────► components/report-form.tsx (client)
      │                        useActionState(createReport)
      │                              │
      │                              ▼
      │                        lib/actions/report-actions.ts  "use server"
      │                        1. zod validate (lib/validation.ts)
      │                        2. prisma.item.create
      │                        3. findAndSaveMatches(item)  ← lib/matcher.ts
      │                        4. revalidatePath("/")
      │                              │
/matches/[id] ◄────────────── app/matches/[id]/page.tsx (RSC) ─────► prisma.match (both directions)
```

- **Pages** (`app/`) are React Server Components: all DB reads happen there.
- **The only write path** is one Server Action consumed by the report form via `useActionState`
  (pending state, per-field errors, success hand-off).
- **Matching runs synchronously at submit time**, inside a try/catch so a matcher failure never
  blocks saving a report.

---

## 2. File-by-File: `lib/`

### `lib/prisma.ts` — Database client singleton

| Export | Kind | What it does |
|---|---|---|
| `prisma` | const | The single `PrismaClient` instance used everywhere. Built on the `PrismaPg` driver adapter (`@prisma/adapter-pg`) pointed at `process.env.DATABASE_URL`. In dev it is cached on `globalThis` so Next.js hot reload reuses one client instead of opening new connection pools. |

---

### `lib/nlp.ts` — Text-processing primitives (wraps `natural`)

Module-level setup: a `WordTokenizer`, the `PorterStemmer`, and a small English stop-word list.

| Function | Signature | What it does |
|---|---|---|
| `tokenize` | `(text: string) => string[]` | Lowercases, splits into words, drops stop words and single characters, then Porter-stems each token ("running" → "run"). Feeds all token-based comparisons. |
| `textSimilarity` | `(a: string, b: string) => number` | Jaro-Winkler similarity of two trimmed/lowercased strings. Returns 0–1; 1 = identical. Rewards strings that share a common prefix (good for typos and close spellings). |
| `tokenOverlap` | `(a: string, b: string) => number` | Jaccard overlap of the *stemmed token sets* of two texts: shared / union. Returns 0–1; order-independent, so "black case wireless" ≈ "wireless black case". |
| `stripColorWords` | `(text: string, extra?: string) => string` | Removes color words from a text ("Black backpack" → "backpack"): built-in English color lexicon **plus** any word found in `extra`. |
| `extractItemName` | `(name: string, otherFields?) => string` | What name matching actually uses: strips color lexicon words **and** every word appearing in the given fields (the item's own `color` and `location`), so names compare on item nouns only and color/location can't double-count inside the name signal. |

These three are the only text math in the app — both the name/color/category scores and the
description keyword score are built from them.

---

### `lib/matcher.ts` — The matching engine

**Constants**

| Constant | Value | Purpose |
|---|---|---|
| `WEIGHTS` | category 25 · name 25 · location 20 · date 15 · color 10 · nlp 5 | Point values per signal; total = 100 |
| `DATE_WINDOW_DAYS` | 30 | Only opposite reports within ±30 days are considered |
| `MATCH_THRESHOLD` | 50 | Minimum score to persist a match row |

**Exported functions**

| Function | Signature | What it does |
|---|---|---|
| `getConfidence` | `(score: number) => string` | Maps a score to a label: ≥75 `"Strong Match"`, ≥50 `"Possible Match"`, else `"Weak Match"`. |
| `calculateMatchScore` | `(lost: Item, found: Item) => MatchResult` | Pure function. Runs all six scorers below against an ordered lost/found pair, sums points into `score`, attaches `confidence`, and collects each scorer's human-readable reason (only when it earned points) into `reasons[]`. No DB access — trivially testable. |
| `findAndSaveMatches` | `(item: Item) => Promise<number>` | The orchestrator, called after every report is created. Fetches candidates (opposite `reportType`, still `PENDING`, within ±30 days), scores each via `calculateMatchScore` (ordering arguments correctly for LOST vs FOUND submitters), skips anything under 50, and **upserts** a `Match` keyed by `@@unique([lostItemId, foundItemId])` so re-runs update instead of duplicating. Returns how many matches were saved. |

**Internal scorers** (each returns `{ points, reason? }`; reason present only when points > 0)

| Scorer | Logic |
|---|---|
| `calculateCategoryScore` | Exact match (case-insensitive) = full 25 pts, reason *"Same category"*. Otherwise falls back to fuzzy comparison of the raw category strings (`max(textSimilarity, tokenOverlap)` ≥ 0.6) for proportional points — reason *"Similar category"*. This is what lets free-text "Other…" categories like "small leather goods" match "leather goods". Unrelated categories score 0. |
| `calculateNameScore` | `max(textSimilarity, tokenOverlap)` of **color- and location-stripped** names (`extractItemName` removes lexicon colors plus the item's own color/location words first; if stripping empties a side, the original names are used). Below 0.6 → 0, else proportional points, reason *"Similar item name"*. Color and location therefore never double-count here — each is scored only by its own signal. |
| `calculateLocationScore` | Jaro-Winkler on locations. ≥0.8 earns proportional points (*"Similar location"*); only an exact match gets full points (*"Same location"*). |
| `calculateDateScore` | Linear decay across the ±30-day window (`weight × (1 − gapDays/30)`). Reason always explains the gap direction: *"Found on the same or next day"*, *"Found N days after/before…"*. |
| `calculateColorScore` | If both colors exist and similarity ≥ 0.75, proportional points — *"Same color"* / *"Similar color"*. Missing color on either side scores 0 without penalty elsewhere. |
| `calculateNlpScore` | `tokenOverlap` of descriptions; ≥0.15 earns up to 5 pts, reason *"Descriptions share similar keywords"*. |

---

### `lib/validation.ts` — Shared schema & vocabulary

| Export | Kind | What it does |
|---|---|---|
| `CATEGORIES` | readonly tuple | The fixed dropdown categories: Electronics, Documents, ID Cards, Keys, Clothing, Bags. (No static "Other" — that is a separate form option that reveals a free-text input.) |
| `reportSchema` | zod object | Validates one report submission: `reportType` enum(LOST/FOUND); required `name`, `description`, `location`; optional `category` (≤50 chars) and `color` (≤30 chars); `dateAndTime` coerced to a Date with a friendly error message. Whitespace is trimmed everywhere. |
| `optionalText` | internal helper | Preprocessor factory: turns empty/whitespace strings into `undefined` so truly-optional fields don't store blanks. |
| `ReportInput` | TS type | Inferred shape of a valid report (`z.infer`). |

Both the server action **and** the client form rely on the field-level messages produced here,
so validation copy lives in exactly one place.

---

### `lib/actions/report-actions.ts` — The one write path ("use server")

| Export | Kind | What it does |
|---|---|---|
| `ReportFormState` | interface | Contract between form and action: `status` (`idle` \| `success` \| `error`), optional `message`, `fieldErrors` map, and `itemId` on success (used to link to `/matches/[itemId]`). |
| `createReport` | async fn | `(prevState, formData) => ReportFormState`. Pipeline: ① parse FormData with `reportSchema`; on failure flatten zod errors into one message per field. ② `prisma.item.create`. ③ run `findAndSaveMatches` inside its own try/catch — matching failures are logged but never block the report. ④ `revalidatePath("/")` so the dashboard shows fresh counts/items, then return success with the new item's id. Unexpected DB errors collapse into a generic retry message (details stay in server logs). |

---

### `lib/utils.ts` — Styling helper (shadcn convention)

| Function | Signature | What it does |
|---|---|---|
| `cn` | `(...inputs: ClassValue[]) => string` | Merges conditional Tailwind class lists (`clsx`) and resolves conflicts (`tailwind-merge`). Used by every UI component. |

---

## 3. Supporting Pieces (non-lib, quick map)

| Location | Role |
|---|---|
| `prisma/schema.prisma` | `Item` (report fields, status, indexes) and `Match` (score, confidence, reasons JSON, unique pair constraint, cascading FKs) |
| `app/page.tsx` | Dashboard: stat chips, search (via `components/search-bar.tsx`), recent reports grid |
| `app/report/page.tsx` + `components/report-form.tsx` | Submission form; hybrid category select where "Other…" reveals a custom-text input; date/time chosen with `components/datetime-picker.tsx` |
| `app/matches/[id]/page.tsx` | Ranked matches for any item, looked up in both directions (lost→found and found→lost) |
| `prisma/seed.ts` | Demo data pushed through the real `findAndSaveMatches` |
