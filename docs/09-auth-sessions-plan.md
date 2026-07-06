# Auth migration plan — roll-your-own sessions (Path A, the official path)

*Branch `feat/auth-sessions`. Status: **✅ implemented & verified** (2026-07-05).
Lucia removed; `src/lib/server/auth/` in place; migration
`20260705212617_reshape_session` applied; 54 unit tests + auth/rooms/match e2e
green; production build passes. Sections below are the design as built.*

> **As-built deltas from the plan:** session cookie is `hyperchess_session`;
> session ids are 40-char base32 (25 random bytes); the old test users were
> wiped (`TRUNCATE auth_user CASCADE`) since their Lucia scrypt hashes don't
> verify under argon2 — re-signup to recreate. Note: the internal
> `/api/{ws,publish,add,remove}` calls send a JSON string without a
> `content-type`, so the browser labels them `text/plain`; SvelteKit's
> re-enabled CSRF allows them because same-origin fetches carry a matching
> `Origin` (server-to-server callers must send `Origin`, as the e2e scripts do).

Replaces Lucia v2 with a hand-rolled session module, per Lucia's own guidance —
the library (v2 **and** v3) is deprecated and is now a "learning resource":

- Migrate guide: <https://lucia-auth.com/lucia-v3/migrate>
- Session implementation guide: <https://lucia-auth.com/sessions/basic>

**Never migrate to Lucia v3** — it is also deprecated; it would be a breaking
rewrite onto another dead version.

## Sequencing (important)

Implement **after** the pending PR stack merges (master ← #5 room-persistence ←
#6 game-rules ← #7 match-flow). The stack adds five new `locals.auth.validate()`
call sites (rooms/join/games routes); doing auth after lets one PR swap every
call site in a single sweep instead of cross-branch conflicts.

```
merge #5 → #6 → #7   →   rebase feat/auth-sessions on master   →   implement below
```

## What we get out of it

1. Zero dead auth dependencies (`lucia`, `@lucia-auth/adapter-prisma`,
   `@lucia-auth/oauth` all removed).
2. Kills both known Lucia v2 traps:
   - `session.user` only carrying `userId` (ignored v1 `transformDatabaseUser`) —
     our hook will attach the full user.
   - Origin-gated `validate()` silently returning null on non-GET without a
     matching `Origin` header — we control validation; CSRF moves to SvelteKit's
     own `checkOrigin` (re-enabled).
3. Kills the insecure manual `secure:false` cookie in `login/+page.server.ts`.
4. Argon2id password hashing (Lucia v2 used its own scrypt format).

## Design

### New files

```
src/lib/server/auth/
├── session.ts    # create/validate/invalidate sessions over Prisma
├── password.ts   # argon2id hash/verify (@node-rs/argon2)
└── cookie.ts     # set/delete the session cookie on SvelteKit's cookies API
```

### DB — one small migration, reuse the tables

Keep `auth_user` and `auth_key` (the `hashed_password` column) as-is. Reshape
`auth_session`: Lucia's `active_expires`/`idle_expires` (BigInt ms) become one
`expires_at` timestamp.

```sql
-- 20260XXX_reshape_session/migration.sql
TRUNCATE "auth_session";                        -- signs everyone out (only test users exist)
ALTER TABLE "auth_session" DROP COLUMN "active_expires";
ALTER TABLE "auth_session" DROP COLUMN "idle_expires";
ALTER TABLE "auth_session" ADD COLUMN "expires_at" TIMESTAMP(3) NOT NULL;
```

Prisma model: `AuthSession { id String @id; user_id String; expires_at DateTime }`.

### session.ts (per the official guide, adapted to Prisma)

```ts
const SESSION_LIFETIME_S = 60 * 60 * 24 * 30;   // 30 days

generateSessionId(): 25 random bytes (crypto.getRandomValues) → base32 lowercase
createSession(userId) → insert { id, user_id, expires_at: now + 30d }
validateSession(id) →
  - lookup by id (join user); null if missing
  - expired → delete row, return null
  - past half-life → extend expires_at (sliding renewal, one UPDATE)
  - return { session, user }
invalidateSession(id) / invalidateAllSessions(userId) → deletes
```

Optional hardening (note, not required for v1): store `sha256(token)` as the row
id and hand the raw token only to the cookie, so a DB leak doesn't leak live
session ids.

### password.ts

```ts
import { hash, verify } from '@node-rs/argon2';   // argon2id defaults:
// memoryCost 19456, timeCost 2, outputLen 32, parallelism 1 (OWASP baseline)
```

Existing passwords are Lucia-v2 scrypt (`s2:salt:hash` in `auth_key.hashed_password`).
Only test users exist ⇒ **plan: truncate `auth_key`/re-signup the two test users.**
(If real users existed: verify legacy format on login, then re-hash to argon2 —
standard hash upgrade; keep that code path out until needed.)

### cookie.ts

`hyperchess_session` cookie: `HttpOnly; SameSite=Lax; Path=/; Max-Age=30d;
Secure` — `secure: !dev` via `$app/environment` (SvelteKit `cookies.set` handles
attributes; no hand-built header strings).

### hooks.server.ts

```ts
const sessionId = event.cookies.get(SESSION_COOKIE);
const { session, user } = sessionId ? await validateSession(sessionId) : { ... nulls };
event.locals.session = session;
event.locals.user = user;              // full user: id, username, name, email
// on validation renewal → refresh cookie; on invalid → delete cookie
```

Also **delete** the wildcard-CORS header block (same-origin app; leftover from
the external-relay era) and update `src/app.d.ts` `Locals` to
`{ user: SessionUser | null; session: Session | null }`.

## Call-site swap inventory (post-stack, complete)

| File | Today | Becomes |
|---|---|---|
| `src/lib/server/lucia.ts` | Lucia init | **delete** |
| `src/hooks.server.ts` | `auth.handleRequest` + CORS appends | cookie→validate→locals |
| `src/routes/signup/+page.server.ts` | `auth.createUser` | create user + `auth_key` w/ argon2 hash + `createSession` + set cookie |
| `src/routes/login/+page.server.ts` | `auth.useKey` + manual insecure cookie | lookup key, `verify()`, `createSession`, set cookie (manual cookie **removed**) |
| `src/routes/api/logout/+server.ts` | `auth.invalidateSession` | `invalidateSession` + delete cookie |
| `src/routes/+page.server.ts` (load) | `locals.auth.validate()` + Prisma re-fetch | `locals.user` (re-fetch no longer needed) |
| `src/routes/api/rooms/+server.ts` POST | `locals.auth.validate()` | `locals.user` guard |
| `src/routes/api/rooms/[id]/+server.ts` DELETE | 〃 | 〃 |
| `src/routes/api/rooms/[id]/join/+server.ts` (#7) | 〃 | 〃 |
| `src/routes/api/games/[id]/+server.ts` (#7) | 〃 | 〃 |
| `src/routes/api/games/[id]/move/+server.ts` (#7) | 〃 | 〃 |
| `src/lib/server/rooms/service.ts` | re-fetches username (trap #1 workaround) | take username from `locals.user`, drop re-fetch |
| `src/app.d.ts` | `Locals { auth }` | `Locals { user, session }` |

## Cleanup in the same PR

- `package.json`: remove `lucia`, `@lucia-auth/adapter-prisma`, `@lucia-auth/oauth`;
  add `@node-rs/argon2`.
- `svelte.config.js`: re-enable CSRF — remove `csrf: { checkOrigin: false }`
  (same origin everywhere now; this was for the gh-pages/static era).
- Remove session/key `console.log`s in login/signup (they leak into logs);
  Lucia `debugMode` goes away with Lucia.
- `docs/05`: mark Tier 2 items done.

## Tests & acceptance

**Unit (vitest):** session lifecycle — create→validate roundtrip; expired →
null + row deleted; half-life → `expires_at` extended; invalidate(-All); password
hash/verify + rejects wrong password. (Session tests hit Prisma → run against the
dev DB, or factor the queries behind a tiny interface and stub.)

**e2e (scripted, like `rooms-e2e`/`match-e2e`):** signup → cookie set (HttpOnly,
SameSite=Lax) → authed `GET /` 200 → create room 201 → logout → same calls 401/302
→ login → authed again → **POST without Origin header still works** (proves trap
#2 is gone; SvelteKit CSRF still blocks *cross-origin* form posts).

**Acceptance:** `pnpm test` green; e2e green; `grep -r lucia src/` empty;
`pnpm build` passes; rooms + match e2e scripts still pass unchanged (they only
depend on the cookie name — update `auth_session` → `hyperchess_session` there).

## Estimate & order of work

Half a day. Order: migration + session/password/cookie modules + unit tests →
hooks + app.d.ts → signup/login/logout → the eight `locals` guards → cleanup →
e2e → docs. Single PR: `feat/auth-sessions` → master (after the stack merges).
