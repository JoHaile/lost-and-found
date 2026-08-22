# Lost & Found Matcher — Implementation Prompt

## Role

You are a senior full-stack engineer implementing a **small Software Engineering Assessment project**.

Build a simple, clean, maintainable **Lost & Found Matcher** using:

- **Next.js** App Router + TypeScript
- **Server Actions**
- React `useActionState`
- **Prisma**
- PostgreSQL
- **Natural** npm library for lightweight NLP
- **shadcn/ui**
- Tailwind CSS

The most important requirement is:

> **Keep the implementation simple. This is an interview assessment, not a production-scale system.**

Do not over-engineer the project, introduce unnecessary abstractions, or add technologies that are not needed.

---

# 1. Project Goal

The application allows university users to submit either:

- a **Lost** item report
- a **Found** item report

The system should automatically find potential matches between lost and found reports.

The matching system should use a **hybrid approach**:

1. Structured database information
2. Weighted field matching
3. Lightweight NLP using the `natural` library
4. Explainable match results

The user should be able to understand **why** two reports were considered a match.

---

# 2. Application Structure

Keep the routing intentionally small.

```text
app/
├── page.tsx
├── report/
│   └── page.tsx
└── matches/
    └── [id]/
        └── page.tsx

components/
├── report-form.tsx
├── report-list.tsx
├── match-card.tsx
├── match-list.tsx
└── ...

lib/
├── actions/
│   └── report-actions.ts
├── matcher.ts
├── nlp.ts
├── validation.ts
└── prisma.ts

prisma/
└── schema.prisma
```

### Pages

### `app/page.tsx`

Main dashboard.

It should contain:

- Page title
- Short explanation of the application
- Search input
- Recent reports
- Report type/status indicators
- Button/link to submit a report
- A simple empty state when there are no reports

Keep the dashboard visually clean.

---

### `app/report/page.tsx`

A single form for submitting either a Lost or Found report.

Do **not** create separate Lost and Found pages.

Use one field to choose:

```text
LOST
FOUND
```

Fields:

- Report Type
- Item Name
- Category
- Color
- Description
- Location
- Date and Time

Required:

- report type
- item name
- description
- location
- date/time

Optional:

- category
- color

Use shadcn/ui form-related components.

---

### `app/matches/[id]/page.tsx`

Dynamic route showing potential matches for one report.

Example:

```text
/matches/cuid123
```

The page should show:

- Original report
- Report type
- Item information
- Ranked potential matches
- Match score
- Confidence level
- Match reasons

Example:

```text
91% — Strong Match

✓ Same category
✓ Similar item name
✓ Same location
✓ Similar color
✓ Close date
✓ Similar description
```

Also show a useful empty state:

```text
No potential matches found.
```

---

# 3. Database Schema

Use this Prisma schema as the starting point:

```prisma
generator client {
  provider = "prisma-client"
  output = "../generated/prisma"
  runtime = "nodejs"
  moduleFormat = "esm"
  importFileExtension = "ts"
}

datasource db {
  provider = "postgresql"
}

enum ReportType {
  LOST
  FOUND
}

enum Status {
  PENDING
  RESOLVED
}

model Item {
  id          String     @id @default(cuid())
  name        String
  description String
  location    String
  category    String?
  color       String?
  dateAndTime DateTime
  reportType  ReportType
  status      Status     @default(PENDING)
  createdAt   DateTime   @default(now())

  lostMatches  Match[] @relation("LostItemMatches")
  foundMatches Match[] @relation("FoundItemMatches")

  @@index([reportType])
  @@index([category])
  @@index([status])
  @@index([dateAndTime])
}

model Match {
  id          String   @id @default(cuid())

  lostItemId  String
  foundItemId String

  score       Float
  confidence  String
  reasons     Json?

  createdAt   DateTime @default(now())

  lostItem    Item @relation("LostItemMatches", fields: [lostItemId], references: [id], onDelete: Cascade)
  foundItem   Item @relation("FoundItemMatches", fields: [foundItemId], references: [id], onDelete: Cascade)

  @@unique([lostItemId, foundItemId])
  @@index([lostItemId])
  @@index([foundItemId])
  @@index([score])
}
```

Do not add unnecessary models.

---

# 4. Matching Architecture

Implement the matching pipeline as simply as possible.

```text
User submits report
        ↓
Validate input
        ↓
Save Item
        ↓
Find opposite-type candidates
        ↓
Filter candidates by reasonable criteria
        ↓
Compare structured fields
        ↓
Run Natural NLP on text
        ↓
Calculate weighted score
        ↓
Generate confidence level
        ↓
Generate match reasons
        ↓
Save Match records
        ↓
Show ranked results
```

---

# 5. Candidate Retrieval

When a Lost item is created:

```text
Search FOUND items
```

When a Found item is created:

```text
Search LOST items
```

Never match:

```text
LOST → LOST
FOUND → FOUND
```

Use the database to reduce the candidate pool, but **do not make filtering so strict that valid matches are removed**.

Use reasonable candidate filtering such as:

- opposite report type
- pending status
- same/similar category when category exists
- reasonable date range

Do not require exact location or exact text at the database level.

The database filter is only for **candidate retrieval**.

The actual matching decision must happen in the matcher.

---

# 6. Structured Matching Score

Create a simple weighted scoring system.

Recommended weights:

```text
Category       25 points
Item name      25 points
Location       20 points
Date proximity 15 points
Color          10 points
NLP             5 points
--------------------------------
Total          100 points
```

You may slightly adjust these weights if necessary, but keep the scoring logic simple and deterministic.

The key goal is that:

> Structured information is the primary signal, while NLP is supporting evidence.

---

# 7. NLP Using `natural`

Use the `natural` npm package.

Do not build a complicated NLP pipeline.

Create a small utility such as:

```text
lib/nlp.ts
```

Use Natural for:

- tokenization
- normalization
- stemming
- text similarity

The description:

```text
"Black AirPods case"
```

should become normalized tokens similar to:

```text
["black", "airpod", "case"]
```

Use Natural's available similarity functionality where appropriate.

The purpose is to handle cases where wording is slightly different.

For example:

```text
"black airpods case"
```

and

```text
"dark wireless earbud case"
```

should still have some textual similarity.

Do not introduce embeddings, vector databases, external AI APIs, or LLMs.

---

# 8. Location Matching

Keep location matching simple.

Examples:

```text
"Library" vs "Library"
→ strong match

"Library" vs "Library entrance"
→ good match

"Library" vs "Football Field"
→ low/no match
```

Normalize location strings before comparison.

You may use simple string similarity rather than complex geospatial logic.

Do not add maps or GPS functionality.

---

# 9. Date Matching

Compare the dates/times of the two reports.

Example behavior:

```text
Same day        → very strong
1 day apart     → strong
2–3 days apart  → moderate
Many days apart → weak
```

Do not require exact timestamps.

The date score should decrease as the gap increases.

---

# 10. Confidence Levels

Convert the final score into a human-readable confidence level:

```text
75–100 → Strong Match
50–74  → Possible Match
0–49   → Weak Match
```

Return both:

```text
score
confidence
```

Example:

```text
score: 87
confidence: "Strong Match"
```

---

# 11. Match Reasons

The matcher must also generate explanations.

Example:

```json
[
  "Same category",
  "Similar item name",
  "Same location",
  "Similar color",
  "Found 1 day after the item was reported lost",
  "Description contains similar keywords"
]
```

Only include reasons that actually contributed to the score.

These reasons will be displayed in the UI.

This is an important part of the project.

Do not show only a percentage without an explanation.

---

# 12. Match Persistence

When a report is submitted:

1. Save the new `Item`
2. Find candidate opposite-type reports
3. Calculate matches
4. Save qualifying matches into the `Match` table

Only persist meaningful matches.

For example:

```text
score >= 50
```

can be used as the minimum threshold.

Avoid storing obviously useless matches.

Use the unique constraint:

```prisma
@@unique([lostItemId, foundItemId])
```

to prevent duplicate match records.

---

# 13. Server Actions

Use **Server Actions** for mutations.

Do not create unnecessary API routes for the main application flow.

Create something like:

```text
lib/actions/report-actions.ts
```

with a server action such as:

```text
createReport()
```

The server action should:

1. Validate form data
2. Create the report
3. Run candidate matching
4. Persist matches
5. Return success/error state

---

# 14. `useActionState`

Use React's:

```tsx
useActionState
```

for the report submission form.

The form should have:

```text
idle
loading
success
error
```

states.

Do not manually build a complicated global state system.

The submission flow should be simple:

```text
Submit
  ↓
pending
  ↓
Server Action
  ↓
success / error
```

---

# 15. Error Handling

The report form must show clear validation and server errors.

Examples:

```text
Item name is required.
Description is required.
Location is required.
Date and time is required.
```

Also handle unexpected server errors gracefully.

Do not expose raw Prisma or database errors to the user.

Show a clean general message such as:

```text
Something went wrong while submitting the report.
Please try again.
```

Use an appropriate shadcn/ui component for error messaging.

---

# 16. Validation

Use a simple schema validation solution such as Zod if needed.

Validate:

- strings are not empty
- date is valid
- report type is valid
- optional fields are handled correctly

Keep validation close to the server action so the server remains the source of truth.

Client-side validation can improve UX but should not replace server validation.

---

# 17. shadcn/ui

Use shadcn/ui components throughout the interface where appropriate.

Prefer components such as:

- Button
- Input
- Textarea
- Label
- Select
- Card
- Badge
- Alert
- Separator
- Skeleton
- Dialog if actually needed

Do not use every shadcn component just to demonstrate the library.

Use only what improves the interface.

The interface should feel clean and professional.

---

# 18. UI Design

Use a simple modern dashboard.

Prioritize:

- good spacing
- readable typography
- clear hierarchy
- responsive design
- accessible form controls
- obvious actions
- useful empty states

Use cards for reports and matches.

Example:

```text
┌────────────────────────────────────┐
│ Black AirPods Case                 │
│ LOST                               │
│ Electronics • Library              │
│ Aug 20, 2026                       │
│                                    │
│ Best Match                         │
│ 87%  Strong Match                  │
│                                    │
│ [View Matches]                     │
└────────────────────────────────────┘
```

Do not create excessive animations or complicated visual effects.

---

# 19. Dashboard Search

Implement a simple search on the dashboard.

Search should be able to find reports by useful text such as:

- item name
- description
- location
- category
- color

Keep the search simple.

Do not build Elasticsearch or another search engine.

---

# 20. Match Page

For `/matches/[id]`:

Fetch the selected report and its matches.

Order matches by:

```text
score DESC
```

Show the highest-quality matches first.

Each match card should show:

- matched item
- score
- confidence
- date
- location
- description
- reasons

The page should make it obvious which item belongs to the original report and which one is the candidate.

---

# 21. Important Implementation Rules

### Keep it simple

Do NOT add:

- Redux
- Zustand
- GraphQL
- tRPC
- WebSockets
- external AI APIs
- vector databases
- microservices
- unnecessary repositories/services
- complicated design patterns

A few well-organized files are better than a large architecture.

### Prefer readable code over clever code.

Avoid:

```text
10 tiny abstractions for a 100-line feature.
```

Prefer straightforward functions such as:

```text
normalizeText()
calculateCategoryScore()
calculateLocationScore()
calculateDateScore()
calculateNlpScore()
calculateMatch()
```

---

# 22. Suggested Matcher Functions

A simple implementation could look conceptually like:

```ts
calculateMatchScore(lostItem, foundItem)
```

which internally uses:

```ts
calculateCategoryScore()
calculateItemScore()
calculateLocationScore()
calculateDateScore()
calculateColorScore()
calculateNlpScore()
```

Then return:

```ts
{
  score: 87,
  confidence: "Strong Match",
  reasons: [...]
}
```

Keep the logic easy to read and test.

---

# 23. Code Quality

Follow these principles:

- TypeScript everywhere
- Strong typing
- Small functions
- Clear names
- No duplicated matching logic
- Server-side validation
- Proper error handling
- Reusable shadcn/ui components
- Minimal dependencies
- No unnecessary comments

Comments should explain **why**, not obvious code.

---

# 24. Final Expected User Flow

The final application should work like this:

```text
User opens dashboard
        ↓
Clicks "Report Item"
        ↓
Chooses Lost or Found
        ↓
Fills structured fields + description
        ↓
Submits form
        ↓
Server Action validates and saves report
        ↓
Matcher finds opposite-type candidates
        ↓
Natural processes descriptions
        ↓
Weighted scoring calculates matches
        ↓
Useful matches are persisted
        ↓
User returns to dashboard
        ↓
Clicks "View Matches"
        ↓
/matches/[id]
        ↓
Ranked, explainable potential matches
```

---

# 25. Main Engineering Goal

The application should demonstrate that you can:

- design a sensible database schema
- build a Next.js application using App Router
- use Server Actions correctly
- handle form state with `useActionState`
- validate and handle errors
- design a simple matching algorithm
- combine structured data with NLP
- persist relationships using Prisma
- create a clean UI with shadcn/ui
- write understandable code

**Do not optimize prematurely.**

The project should feel like a **well-engineered interview MVP**: small, clear, functional, explainable, and easy for another developer to understand.