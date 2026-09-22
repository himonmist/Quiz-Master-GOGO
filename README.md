# Quiz Master GOGO

**Think Fast. Answer Right. Rise to the Top.**

A real-time competitive quiz platform: server-authoritative scoring, live leaderboards,
multi-tenant organizations, and an admin suite for building and running competitions.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS v4 + a small hand-built component layer (`src/app/globals.css`) implementing the "Organic" design system (terracotta/sage, Caprasimo + Figtree) |
| Database | PostgreSQL via [Neon](https://neon.tech), accessed through Prisma ORM |
| Auth | Custom JWT + httpOnly cookie sessions, backed by a revocable `sessions` table (bcrypt password hashing) |
| Validation | Zod |
| Testing | Vitest (scoring engine + leaderboard tie-breaking) |
| Deploy target | Vercel (app) + Neon (database) |

Why not NextAuth or a newer Next.js major: this build deliberately pins to
Next.js 15 and NextAuth-free custom auth to avoid depending on preview-stage
APIs (Next 16's Cache Components model, NextAuth v5 beta) inside a
production-facing codebase. Swapping in NextAuth or upgrading Next later is a
contained change — auth lives entirely in `src/lib/auth.ts`.

## Architecture

```
Organization (tenant)
 └─ Course
     └─ Quiz (questions selected from the org's Question bank)
         └─ QuizAttempt (one per participant per attempt)
             └─ QuizAttemptQuestion  ── server-owned timer (serverStartedAt/serverDeadlineAt)
                 └─ Answer            ── server-computed score, never trusts the client
```

**The frontend displays the competition. The backend controls the competition.**
Every score, timer, correctness flag, and rank is computed and persisted server-side
(`src/lib/quiz-engine.ts`, `src/lib/scoring.ts`). The client only ever receives a
deadline timestamp to render a countdown from; submitting late is independently
detected server-side regardless of what the client's own timer showed.

### Scoring formula (`src/lib/scoring.ts`, unit-tested in `src/lib/__tests__/scoring.test.ts`)

```
SpeedRatio    = max(0, 1 - responseTimeMs / maxTimeMs)
QuestionScore = accuracyWeight + speedWeight × SpeedRatio     (correct answer)
              = 0  (or -negativeMarks if negative marking is on)  (incorrect answer)
```

`accuracyWeight`/`speedWeight` default to 80/20 and are configurable per quiz within
70–95% / 5–30%, enforced so speed can never outweigh correctness. An optional per-question
difficulty multiplier (Easy ×1.0, Medium ×1.15, Hard ×1.3) can be toggled on per quiz.

### Leaderboard tie-breaking (`compareAttempts` in `src/lib/scoring.ts`)

Score desc → correct-answer count desc → accuracy desc → total response time asc →
completion time asc. Never random.

### Real-time leaderboard

The leaderboard is computed live from Postgres on every request and the client polls
it every 2.5–6s (`GET /api/attempts/:id/leaderboard`, `LiveLeaderboardClient.tsx`).
This is a deliberate simplification for a Vercel/serverless deploy target: true
push-based real-time (Redis sorted sets + WebSocket/Socket.IO, as the original spec
describes) needs a persistent process, which a Vercel serverless function isn't. The
query itself (`getLeaderboard` in `quiz-engine.ts`) is written so it can be swapped for
a `ZADD`/`ZREVRANGE` Redis-backed version, with the polling endpoint replaced by a
WebSocket push, without touching the scoring or attempt logic.

## What's implemented in depth vs. what's a deliberate simplification

The original product spec (see the task prompt) describes a full enterprise SaaS
platform — every one of its ~53 sections would be its own multi-week project. This
build prioritizes a genuinely working, correctly-engineered **core**:

**Fully implemented:**
- Registration/login/logout, forgot/reset password, session revocation, RBAC
  (SUPER_ADMIN / ORG_ADMIN / QUIZ_MANAGER / PARTICIPANT)
- Multi-tenant data model — every query is scoped by `organizationId`
- Course, question bank (single/multi-choice, true/false), and quiz management
  (randomized question/answer order, negative marking, speed bonus, difficulty
  weighting, attempt limits, scheduling, answer-reveal policy)
- The full question-by-question quiz-taking flow with a server-owned timer,
  idempotent answer submission, and reconnect/resume support
- Server-authoritative scoring exactly matching the spec's formula, unit-tested
  against the spec's own worked examples
- Live leaderboard with deterministic tie-breaking
- Result page with rank/percentile/accuracy and a detailed per-question review
- Anti-cheat event logging (tab switch, window blur, copy/paste) surfaced to admins,
  never auto-disqualifying on a single event
- Audit logging of key actions (login, quiz started/completed, admin CRUD, suspensions)
- Auto-issued, QR-verifiable certificates with a public `/verify/:code` page
- Admin dashboard (KPIs, live monitor, score distribution), question/course
  analytics (hardest/slowest questions), participant management
- Seed data matching the spec's demo scenario (§51)

**Deliberately simplified / stubbed, with the extension point noted in code:**
- **Email delivery** — verification/reset tokens are generated and stored
  (`Notification` rows, `PENDING` status) but no SMTP/SES/SendGrid provider is wired
  up; in dev, the reset link is returned directly by the API for convenience.
- **Real-time transport** — polling instead of Redis + WebSocket (see above).
- **Rate limiting** — in-memory per-instance (`src/lib/rate-limit.ts`); note in that
  file on swapping to Redis for a multi-instance deployment.
- **CSV/Excel question import**, **PDF/Excel report export**, **SMS/push
  notifications** — not built; the `Notification.channel` enum already anticipates
  them.
- **Super-admin cross-organization console** — the schema supports it
  (`organizationId` nullable on `User`), but the seeded Super Admin operates within
  one organization; a dedicated "manage all organizations" UI wasn't built.
- **Dispute management / manual score overrides** — the `score_records` table and
  its audit trail exist in the schema; the admin UI for "recalculate / void /
  add bonus points" wasn't built.

## Local development

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL/DIRECT_URL (Neon or local Postgres) and JWT_SECRET
npx prisma generate
npx prisma migrate deploy # applies prisma/migrations/ (idempotent)
npx prisma db seed        # optional demo data — see prisma/seed.ts
npm run dev
```

Or with Docker Compose (spins up a local Postgres alongside the app):

```bash
docker compose up --build
```

### Tests

```bash
npx vitest run     # scoring engine + leaderboard tie-breaking (21 tests)
npx tsc --noEmit    # typecheck
npm run lint         # eslint
npm run build         # production build
```

## Deployment (Vercel + Neon)

1. Create a Neon project (or use an existing one) and copy its pooled connection
   string into `DATABASE_URL`, and the non-pooled ("-pooler" removed from the host)
   connection string into `DIRECT_URL`.
2. Import the repo into Vercel. Set `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and
   `NEXT_PUBLIC_APP_URL` (your production URL) as environment variables.
3. Run `npx prisma migrate deploy` once against the production database (from a
   machine with normal network access — Vercel's build step or your own machine;
   Prisma Migrate needs a direct TCP connection to Postgres, which is why this step
   isn't automatic in `next build`).
4. Optionally run `npx prisma db seed` for demo data.
5. Deploy. Vercel's `next build` will run `prisma generate` automatically via the
   `postinstall` lifecycle if you add one, or add `npx prisma generate &&` to the
   build command.

## Demo accounts

Seeded by `prisma/seed.ts` (password `Password123` for every account):

| Role | Email |
|---|---|
| Super Admin | `super.admin@quizmastergogo.demo` |
| Org Admin | `admin@bdli.demo` |
| Quiz Manager | `quizmanager@bdli.demo` |
| Participant (20 seeded) | e.g. `nadia.rahman0@bdli.demo` |

Organization: **Bangladesh Digital Learning Institute** · Course: **AI for
Government Officers** · live competition: **AI Fundamentals Challenge 2026**
(20 questions, 20 participants with realistic score/accuracy/response-time spread).

## Project structure

```
src/
  app/
    (participant)/        dashboard, courses, history, certificates, profile — sidebar shell
    admin/                 admin dashboard, courses/quizzes/questions CRUD, analytics, audit log
    quiz/[quizId]/lobby     join screen
    quiz/attempt/[id]        the question-by-question quiz screen + leaderboard + result
    verify/[code]            public certificate verification
    api/                     route handlers (auth, quizzes, attempts, admin CRUD)
  components/               shared + admin UI components
  lib/
    auth.ts                 sessions, password hashing, RBAC helpers
    quiz-engine.ts           start/serve/answer a quiz attempt — the server-authoritative core
    scoring.ts               pure scoring + tie-break functions (unit-tested)
    db.ts, audit.ts, rate-limit.ts, validation.ts, constants.ts
  middleware.ts               Edge-safe cookie-presence redirect (real auth check happens server-side)
prisma/
  schema.prisma
  migrations/
  seed.ts                    demo data (uses the same scoring.ts the app uses)
```
