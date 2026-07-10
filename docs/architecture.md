# LinkVault Architecture

## Data Model

```
User ──1:N──> Link ──1:N──> Click
```

- **User**: email + password hash. Links are scoped to a user.
- **Link**: globally unique slug, destination URL, optional title, soft-delete via `deletedAt`.
- **Click**: per-redirect event log with country, device, referrer, and user-agent.

### Non-obvious decisions

- **Click logging is fire-and-forget.** The redirect handler does `fetch` + `waitUntil` (or queues the write) so the redirect is not blocked on the DB write. This keeps redirect latency under 50ms even during traffic spikes.
- **Slugs are globally unique** enforced at the DB level via a `@unique` constraint on `Link.slug`. Users claim a slug when they create a link; duplicates are rejected.
- **Soft-delete on Link** (`deletedAt`). When a user deletes a link, the row stays in the DB with a `deletedAt` timestamp. The redirect handler filters `deletedAt IS NOT NULL`. This preserves click history and allows undelete.

## Auth Flow

1. User registers via `POST /api/register` — password is hashed with Argon2id.
2. User signs in via credentials (email + password) or Google OAuth.
3. Auth.js (next-auth v5) manages sessions via JWT strategy with the Prisma adapter.
4. Protected routes check `auth()` server-side; the proxy layer redirects unauthenticated requests to `/login`.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL (Neon) + Prisma 6
- **Auth:** Auth.js (next-auth v5) + Argon2id
- **Charts:** Recharts
- **Deployment:** Vercel

## API

See the API surface table in the project README.
