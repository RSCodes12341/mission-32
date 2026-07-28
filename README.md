# September Mission

A shared tracker for a friend group working through one mission together — 15 rides
(7 of them pit explorations) and 10 sport days. Everyone joins with an invite code, logs
activities with before/after photos, and watches the same tally fill up.

It's a PWA, so it installs to the home screen on iOS and Android with no App Store and
no Apple Developer account. Push notifications work on both once installed.

## Stack

| Piece | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Postgres + Prisma 6 |
| Auth | Auth.js (NextAuth v5), credentials + bcrypt |
| Photos | Vercel Blob in production, local disk in dev |
| Push | `web-push` + VAPID |
| Hosting | Vercel |

---

## Running it locally

### 1. Postgres

Homebrew (what this repo is set up for):

```bash
brew install postgresql@16 && brew services start postgresql@16 && createdb september_mission
```

Or Docker, using the included `docker-compose.yml` — it binds port **5433** so it can
coexist with a Homebrew Postgres on 5432:

```bash
docker compose up -d
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in:

- `DATABASE_URL` — for Homebrew, the role is your macOS username with no password:
  `postgresql://YOUR_USERNAME@localhost:5432/september_mission?schema=public`.
  For Docker: `postgresql://postgres:postgres@localhost:5433/september_mission?schema=public`
- `AUTH_SECRET` — `openssl rand -base64 32`
- VAPID keys — `npx web-push generate-vapid-keys`, then copy the public key into
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private one into `VAPID_PRIVATE_KEY`
- `BLOB_READ_WRITE_TOKEN` — leave empty locally; uploads go to `public/uploads/` instead

### 3. Install, migrate, run

```bash
npm install && npx prisma migrate dev && npm run dev
```

http://localhost:3000. Browse the data with `npm run db:studio`.

---

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run vercel-build` | What Vercel runs: applies migrations, then builds |
| `npm run db:migrate` | Create + apply a migration from schema changes |
| `npm run db:deploy` | Apply existing migrations (production) |
| `npm run db:studio` | Prisma Studio database browser |
| `npm run db:reset` | Drop and rebuild the database — **deletes all data** |
| `node scripts/generate-icons.mjs` | Regenerate the PWA icons |

---

## Deploying

### 1. Push to GitHub

```bash
git add -A && git commit -m "September Mission" && git branch -M main
```

Create an empty repo on GitHub, then:

```bash
git remote add origin git@github.com:YOUR_USERNAME/september-mission.git && git push -u origin main
```

### 2. Create the Vercel project

Import the repo at [vercel.com/new](https://vercel.com/new). It detects Next.js on its
own — leave the build settings alone, since `vercel-build` in `package.json` already runs
`prisma migrate deploy` before the build.

### 3. Connect a Postgres database

In the project's **Storage** tab, add a Postgres database from the Marketplace (Neon's
free tier is fine). Vercel wires `DATABASE_URL` into the project for you.

### 4. Create a Blob store

Same **Storage** tab → **Blob**. This sets `BLOB_READ_WRITE_TOKEN` automatically. Without
it, photo uploads fail in production with an explicit error — the local-disk fallback is
deliberately disabled there, because serverless filesystems are wiped on every deploy.

### 5. Set the remaining environment variables

Project **Settings → Environment Variables**, for all environments:

| Variable | Value |
|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | public half of `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | private half of the same pair |
| `VAPID_SUBJECT` | `mailto:your@email.com` |

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` is baked in at build time, so set it **before** the first
deploy — if you add it later, redeploy or push notifications won't work.

`DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` come from steps 3 and 4. You don't need
`AUTH_TRUST_HOST` on Vercel.

### 6. Deploy

Push to `main`. The build applies migrations automatically.

---

## Inviting people

1. Sign in and hit **New mission**. You get a 6-character invite code (no `0`/`O`/`1`/`I`,
   so it's unambiguous read aloud).
2. **Copy invite link** puts `https://your-app.vercel.app/mission/join?code=XXXXXX` on your
   clipboard. Anyone opening it signs in (or registers) and joins in one tap.
3. Or they can go to **Join with a code** and type the code by hand.

Someone who isn't a member of a mission can't load its page — they get bounced to the join
screen rather than shown the data.

---

## Installing to a home screen

**iOS (16.4+):** open the site in Safari → Share → **Add to Home Screen** → open it from
the new icon. This step is mandatory before notifications can be enabled — iOS does not
offer push permission to a regular Safari tab, so the button will tell you to install
first.

**Android (Chrome):** an install prompt appears on its own, or use ⋮ → **Install app**.

Once installed it runs full-screen with no browser chrome, and pages you've already
visited open offline.

---

## Turning on notifications

On the mission page, tap **Turn on notifications**, then accept the browser prompt. From
then on, every time another member logs something you get "*Name* logged a ride". Tapping
the notification opens that mission.

You only get notified about *other* people's entries, never your own. Each device
subscribes separately, so enable it once per phone or laptop. Subscriptions that the push
service reports as expired are deleted automatically.

---

## How the tally works

A pit exploration is a ride too, so it counts toward both the ride and pit totals. Sport
days are separate. With the defaults, 15 rides / 7 pits / 10 sport days, the mission is
complete at 15 rides of which at least 7 were pit explorations, plus 10 sport days.

You can delete your own entries — they come off the tally immediately. You can't delete
anyone else's.

---

## Data model

See [prisma/schema.prisma](prisma/schema.prisma).

- **User** — `id`, `name`, `email` (unique), `passwordHash`, `createdAt`
- **Mission** — `id`, `name`, `inviteCode` (unique), `rideTarget`, `pitTarget`,
  `sportTarget`, `createdById`, `createdAt`
- **Membership** — `id`, `userId`, `missionId`, `joinedAt`; unique on `(userId, missionId)`
- **Activity** — `id`, `missionId`, `userId`, `kind` (`RIDE` | `PIT` | `SPORT`), `note?`,
  `beforePhotoUrl?`, `afterPhotoUrl?`, `createdAt`
- **PushSubscription** — `id`, `userId`, `endpoint` (unique), `p256dh`, `auth`, `createdAt`

Deleting a user or mission cascades to memberships, activities, and subscriptions.

---

## Notes on a few decisions

**Photos are downscaled in the browser** before upload — longest edge 1600px, JPEG q82.
Phone cameras produce 4–12MB files that would otherwise hit the 8MB limit and crawl on
mobile data. HEIC can't be decoded outside Safari, so those upload untouched and the
server-side 8MB limit still applies.

**The service worker is network-first for pages.** A shared tally that shows stale numbers
is worse than one that takes an extra moment, so the cache is only a fallback for offline.
Bump `VERSION` in [public/sw.js](public/sw.js) to force clients to drop old caches.

**Passwords are bcrypt at cost 12**, and a wrong email is compared against a dummy hash so
that "no such account" and "wrong password" take the same time and return the same message.
