# Lost & Found Matcher

A campus lost-and-found board where anyone can file a **LOST** or **FOUND** report for an item.
When a report is submitted, the system immediately scans opposite-type reports and surfaces
**explainable matches**, each with a 0–100 score, a confidence label, and the reasons it matched.

Built as a Software Engineering Assessment: Next.js (App Router) + Server Actions, Prisma 7 on Prisma Postgres,
Tailwind CSS v4 + shadcn/ui (base-nova / @base-ui/react), and `natural` for lightweight NLP.

## Getting started

```bash
npm install

# .env in the project root:
# DATABASE_URL="postgres://..."   (Prisma Postgres connection string)

npx prisma migrate dev      # applies schema
npx tsx prisma/seed.ts      # optional demo data (8 items -> 4 designed match pairs)

npm run dev                 # http://localhost:3000
```

## Approach

I built a single vertical slice end to end — schema, matching engine, server action, UI — rather than
horizontal layers, so the core value (a match with reasons) was provable early and everything else
serves it. Reads are React Server Components; the one write path is a Server Action consumed via
`useActionState`, which gives pending state, per-field validation errors, and a success hand-off
("View matches") without any client data-fetching layer. The matcher is a pure function over two
items, deliberately separated from persistence (`calculateMatchScore` vs `findAndSaveMatches`), which
made it testable by inspection and reusable from both the action and the seed script.

## How matching works

1. **Candidate retrieval** — for a new item, fetch opposite-report-type items that are still
   `PENDING` within a ±30-day date window.
2. **Weighted score (0–100)** across six signals:

   | Signal      | Weight | Logic                                                                                                                                                                                         |
   | ----------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Category    | 25     | Exact match = full points; free-text categories fall back to fuzzy similarity (Jaro-Winkler / token overlap ≥ 0.6 → proportional points)                                                      |
   | Name        | 25     | Best of Jaro-Winkler and stemmed token overlap, computed on names stripped of color and location words so those signals can't inflate the name score (each is compared only in its own field) |
   | Location    | 20     | String similarity; full points only at ~exact match                                                                                                                                           |
   | Date        | 15     | Linear decay across the ±30-day window                                                                                                                                                        |
   | Color       | 10     | String similarity when both are provided                                                                                                                                                      |
   | Description | 5      | Stemmed keyword overlap (Jaccard)                                                                                                                                                             |

3. **Persistence gate** — pairs scoring ≥ 50 are saved as matches (upsert keyed on the unique
   lost/found pair, so re-running is idempotent).
4. **Confidence bands** — ≥ 75 _Strong_, ≥ 50 _Possible_, below stays _Weak_ (not persisted).
5. **Explainability** — every contributing signal appends a human-readable reason
   ("Similar category", "Found 2 days after…"), stored as JSON and shown in the UI.

The fuzzy-category fallback exists because "Other…" categories are free text ("small leather goods"
vs "leather goods") where exact comparison would silently miss obvious pairs.

## Assumptions

- **Scale & trust**: a single campus/community deployment with modest volume and good-faith users —
  no auth, pagination, or moderation needed for this scope.
- **Lifecycle**: reports stay `PENDING`; there is no claim/resolution flow, so items remain matchable.
- **Free-text fields**: category (incl. custom), color, and location are compared as plain text;
  no geocoding or controlled vocabularies beyond the fixed category list.
- **Timing**: losing something and someone finding it typically happens close together; ±30 days is a
  reasonable retrieval window, and matching runs synchronously at submit time.
- **One-shot demo**: seed data is illustrative, not representative load.

## Major technical decisions

- **Server Actions over API routes** — one mutation, one client; actions keep validation, DB writes,
  matching, and revalidation co-located with zero client fetching boilerplate.
- **Prisma 7 with driver adapters** (`@prisma/adapter-pg`) and a singleton client cached on
  `globalThis` in dev to survive HMR.
- **zod schema shared by form and action**, mapped to per-field error messages rendered inline.
- **`natural` instead of embeddings/LLMs** — tokenizer → stopwords → Porter stemming feeds classic
  similarity metrics: deterministic, dependency-light, explainable, and fast at this scale.
- **shadcn/ui (base-nova)** components with Inter via `next/font`; the date field is a composed
  calendar + time picker (react-day-picker in a popover) submitting through a hidden input so the
  Server Action contract stays plain `FormData`.
- **Idempotent matching** via upsert on `@@unique([lostItemId, foundItemId])` — safe if triggered again.

## Intentionally not built

- Auth/accounts
- image uploads
- notifications (email/push)
- search filters beyond text query, pagination, admin
- moderation
- geocoding/map-based location matching
- automated test suite
- i18n internationalization

Each was out of scope for demonstrating the core matching loop well, and each would be the first
thing added with real users.

## If this were a real product

- **Identity & privacy first** — accounts, ownership of reports, and strict PII handling (found ID
  cards must never display personal details publicly); publish minimal info, verify claims privately.
- **Claim verification workflow** — private-key questions ("what stickers are on the case?") before
  release, plus status transitions (PENDING → CLAIMED → RESOLVED) and audit trail.
- **Async matching + notifications** — move matching off the request path into a queue, and notify
  users when a later-submitted report matches theirs (today, only the submitter's item triggers scans).
- **Better location intelligence** — geocode locations and compare spatially (radius, same building)
  instead of string similarity.
- **AI-Powered Confidence Scores**: Uses an embedded LLM to evaluate descriptions and generate a smarter match probability. This eliminates minor semantic errors because the LLM easily parses context and synonyms (e.g., "earbuds" ↔ "AirPods"), maintaining our structured, explainable matching interface.
- **Feedback loop** — let users mark matches right/wrong, then measure precision per signal weight and
  tune empirically instead of by intuition.
