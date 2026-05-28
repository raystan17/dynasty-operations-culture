# Dynasty Commissioner Hub

Sleeper-first, front-facing commissioner workspace for a dynasty superflex league.

This app is designed for two league operators:
- Commissioner: Webs
- Co-Commissioner: You

The current league identity defaults to `Slinger's of Dynasty (SoD)` but the data model is rename-safe.

## What is included

- League Home and identity status
- Editable in-app settings panel (league/roles/tone/motto)
- Weekly Control Center
- Matchup Blurb module
- Slinger of the Week panel
- Rivalry Tracker
- Legacy Ledger
- Brand Kit
- Sleeper Sync panel (league ID + week, live API pull)
- Voice Lab (preferred/banned phrases, tone notes, intensity, signature line)
- Accuracy-first recap workflow (facts packet -> narrative prompt)
- Sleeper Publish Queue with reusable prompt blocks
- JSON import/export for restoring or sharing dashboard snapshots
- Seeded sample data for immediate Week 1 use

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Local development

0. Create local env file:

```bash
cp .env.example .env.local
```

Then set your own `AUTH_SECRET` and shared login in `APP_USERS_JSON`.

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Open:

`http://localhost:3000`

## Production build check

```bash
npm run build
```

## Deploy to Vercel

### Option A: Vercel Dashboard
1. Push this project to a Git provider (GitHub/GitLab/Bitbucket).
2. In Vercel, click **Add New Project**.
3. Import the repository and deploy with defaults.
4. Framework should auto-detect as Next.js.

### Option B: Vercel CLI
1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. From this project root (`dos-hub`), run:

```bash
vercel
```

3. For production promotion:

```bash
vercel --prod
```

## Key files

- `src/app/page.tsx` - main commissioner hub UI
- `src/app/login/page.tsx` - private login screen
- `src/app/actions/auth.ts` - login/logout server actions
- `src/lib/auth.ts` - session token and credential validation
- `src/lib/league-data.ts` - seed data and rename-safe league identity
- `src/lib/template-builder.ts` - reusable prompt and Sleeper post builders
- `src/lib/sleeper.ts` - Sleeper sync + voice profile types
- `src/app/api/sleeper/sync/route.ts` - server-side Sleeper API sync endpoint
- `src/components/copy-block.tsx` - copy-to-clipboard prompt blocks

## Auth and privacy notes

- Home route is protected and requires login.
- Session is stored in an HTTP-only cookie.
- App is configured for one shared commissioner login by default.
- You can still provide multiple users via `APP_USERS_JSON` if needed later.
- If a public link leaks, unauthorized users cannot access without valid credentials.

## Quick customization

Edit `src/lib/league-data.ts` to:
- rename league/title safely
- update commissioner names
- add teams, rivalries, and season history
- tune tone, motto, and brand kit values

Or use the in-app `Editable Settings` and `Data Import / Export` panels for rapid iteration without touching files.

## Sleeper integration notes

- Default league ID is prefilled as `1365036347412201472`.
- Sync uses server-side fetches to Sleeper endpoints:
  - `/league/{leagueId}`
  - `/league/{leagueId}/users`
  - `/league/{leagueId}/rosters`
  - `/league/{leagueId}/matchups/{week}`
  - `/league/{leagueId}/transactions/{week}`
  - `/state/nfl`
- Synced facts are surfaced in app and used for recap prompt accuracy.
