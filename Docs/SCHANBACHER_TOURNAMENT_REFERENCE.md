# Schanbacher Tournament Challenge — Project Reference

> **Last updated:** March 19, 2026 (mid-tournament, Round 1 in progress)
> **Purpose:** Context document for continuing development in new Claude sessions

---

## 1. What This Is

A private March Madness bracket competition web app for a small family group. Three players (TLS/Tom, MJS/Mike, JRS/Jack) compete annually by picking every game in the NCAA Tournament. The app tracks picks, auto-scores games via ESPN, displays live scores, and maintains 17 years of historical records (2008–2025, excluding 2020). MJS (Mike) is the admin user and the app developer.

**Long-term goal:** Package this for distribution (App Store / web product) as a multi-tenant bracket challenge platform for families and friend groups. The current version is a working prototype for one group of three.

---

## 2. Architecture

| Layer | Technology | Details |
|-------|-----------|---------|
| Frontend | Next.js 14.2 (React 18) | Single-page app, all UI in one `components/App.jsx` (~1,765 lines, ~137KB) |
| Hosting | Vercel (free tier) | Auto-deploys from `main` branch on GitHub |
| Database | Supabase (free tier) | PostgreSQL with RLS policies; project ID: `xynkeozcivjthklgrsii` |
| External Data | ESPN public API | Scoreboard endpoints for live scores, tipoff times, ESPN IDs |
| Cron Jobs | cron-job.org (free) | 3 jobs: scores (2min), round advancement (5min), ESPN backfill (nightly) |
| Analytics | Vercel Analytics | Added via `@vercel/analytics/next` |
| Auth | Trust-based click-your-name | No passwords; localStorage "remember me" |

**Repository:** `github.com/mschanbacher/schanbacher-tournament` (public)

---

## 3. Codebase Structure

```
schanbacher-tournament/
├── app/
│   ├── page.js              # Entry point — imports App.jsx (MUST bump version comment to force recompile)
│   ├── layout.js            # Root layout with Vercel Analytics
│   ├── globals.css           # Global styles
│   └── api/
│       ├── update-scores/route.js    # ESPN auto-scorer (cron every 2min)
│       ├── advance-round/route.js     # Round advancement (cron every 5min)
│       └── backfill-espn/route.js     # Historical + upcoming ESPN backfill (nightly)
├── components/
│   └── App.jsx              # THE ENTIRE UI — all 22 components in one file
├── lib/
│   ├── queries.js           # Supabase data fetching (fetchBracketForYear, etc.)
│   └── supabase.js          # Supabase client initialization
├── supabase/
│   ├── schema.sql           # Database schema
│   └── seed_history.sql     # Historical data (2008–2025)
├── next.config.js
├── vercel.json              # Function timeout configs
└── package.json
```

### Components in App.jsx (in order)

| Component | Purpose |
|-----------|---------|
| `useIsMobile` | Hook for responsive breakpoint |
| `Lbl` | Reusable label component (small caps, letterspaced) |
| `Loading` | Loading spinner |
| `formatTipoff` | Returns `{day, time}` object from tipoff timestamp |
| `formatClock` | Extracts game clock from ESPN statusDetail |
| `formatPeriod` | Extracts period (1st/2nd/Half/OT) from statusDetail |
| `GameCell` | Individual game display — scores, picks, live indicators, time column |
| `RegionBracket` | 4-round region bracket with SVG connectors |
| `BracketDisplay` | Tab navigation (First Four / regions / Final Four) + round lock logic |
| `StatusBar` | Evolving tournament status (pre → live → complete) with leaderboard |
| `Dashboard` | Home page — status bar, live games section, pick-by-pick grid, standings |
| `BracketView` | Full bracket page with auto-refresh |
| `PicksView` | Pick submission with round tabs, locking, countdown |
| `HallOfFame` | History page — all years, drill into Scores + Bracket per year |
| `GamesTab` | Records sub-tab: blowout misses, contrarian picks, unanimous wrong, accuracy |
| `UpsetsTab` | Records sub-tab: prediction rates, upsets called, best upset calls |
| `StreaksTab` | Records sub-tab: current pick grid, all-time streaks, perfect rounds |
| `RecordsView` | Records page — 6 tabs (Overall, By Round, Streaks, Upsets, Games) |
| `HeadToHead` | H2H rivalry page — win/loss, round dominance, pick agreement |
| `AdminView` | Admin controls (MJS only) — fetch scores, advance round, etc. |
| `PlayerSelect` | Login screen (click your name) |
| `App` | Root component — routing, state, data loading |

---

## 4. Database Schema

### Tables

**players** — `id` (TEXT PK: 'TLS'/'MJS'/'JRS'), `name`, `created_at`

**tournaments** — `year` (INT PK), `status` ('pending'/'active'/'complete'), `current_round`, `champion_player`

**regions** — `id` (SERIAL), `year`, `name`, `position` (1-4)

**games** — `id` (SERIAL), `year`, `region_id`, `round` (0=FF, 1=R1, 2=R2, 3=S16, 4=E8, 5=FF, 6=CH), `game_order`, `seed1`, `team1`, `seed2`, `team2`, `score1`, `score2`, `winner`, `tipoff_time`, `status` ('pending'/'live'/'final'), `espn_id`, `status_detail`

**picks** — `id` (SERIAL), `game_id`, `player_id`, `picked_team`, `points_earned`, `submitted_at`

**season_results** — `id` (SERIAL), `year`, `player_id`, `total_score`, `r1_score` through `r6_score`

**round_schedule** — `id` (SERIAL), `year`, `round`, `tipoff_time` (placeholder time for each round)

### Columns Added After Initial Schema (via ALTER TABLE)
- `games.espn_id` (TEXT) — ESPN game identifier
- `games.status_detail` (TEXT) — ESPN status string e.g. "12:41 - 2nd Half"

### RLS Policies
- Public read on all tables
- Public insert/update on picks, games, tournaments, regions, season_results
- Public delete on picks (needed for "clear picks" feature)

---

## 5. Scoring System

| Round | Points | Max Possible |
|-------|--------|-------------|
| First Four | 1 each | 4 |
| Round 1 (64) | 1 each | 32 |
| Round 2 (32) | 2 each | 32 |
| Sweet 16 | 3 each | 24 |
| Elite 8 | 4 each | 16 |
| Final Four | 5 each | 10 |
| Championship | 6 | 6 |
| **Total** | | **124** |

---

## 6. Design System

**Philosophy:** Dieter Rams inspired. Clean, minimal, zero border-radius, no emoji.

**Font:** Suisse Int'l / Helvetica Neue, tabular numerals throughout.

### Color Scheme

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | `#f5f3ef` | `#1a1a18` |
| Surface | `#f5f3ef` | `#222220` |
| Text | `#1a1a18` | `#e8e6e1` |
| Text Mid | `#555550` | `#a0a09a` |
| Text Light | `#999990` | `#777770` |
| Border | `#d8d5ce` | `#3a3a36` |
| Correct (green) | `#2a6e3f` | `#2a6e3f` |
| Wrong (red) | `#c43e1c` | `#c43e1c` |

### Player Colors

| Player | Light Mode | Dark Mode |
|--------|-----------|-----------|
| TLS | `#12173F` (navy) | `#6b72b3` |
| MJS | `#F04E2C` (orange-red) | `#f27a5e` |
| JRS | `#1E4D42` (forest green) | `#5ba88e` |

### Game Cell Anatomy
```
[44px time col] [24px split bar] [200px game content] [24px status/points]
```
- **Time column:** Tipoff time + day abbreviation stacked (e.g. "12:15p / Thu"), or "Final", or live clock with pulsing red dot
- **Split bar:** Gold (`#C6982B`) when players disagree, transparent when consensus
- **Game content:** Seeds, team names, scores, player pick initials
- **Status column:** Points earned badge (green +N / red 0), or period indicator for live games (1st/2nd/Half/OT)

### Settings
- **Font scaling:** S/M/L/XL via CSS zoom, persisted to localStorage
- **Dark mode:** Toggle, persisted to localStorage
- Both deferred to `useEffect` to avoid React hydration errors

---

## 7. Key Features

### Dashboard
- Evolving status bar (pre-tournament → live → round complete → champion)
- **Live games section** — GameCell components for all in-progress games, auto-refreshes with 30s interval
- Pick-by-pick streak visualization grid with hover tooltips (shows game details)
- Persistent leaderboard with standings bars
- Round breakdown table

### Bracket
- Region tabs + First Four + Final Four
- Tipoff time + day abbreviation to left of each game
- Live scores: red border, pulsing dot, game clock, period indicator, 30s auto-refresh
- Gold split bars for disagreed picks
- Pick visibility: global round-based — all picks in a round visible once ANY game in that round tips off (computed via `isRoundTipped()` across all regions)
- ESPN box score links on completed games
- "Final" label on completed games

### Picks
- Round tabs, pick selection, submit button
- Clear picks button (hidden after tipoff lock)
- Countdown timer per round
- Auto-submit detection when last pick in round is selected

### History
- Table of all years (2008–2025 + current)
- Drill into Scores + Bracket tabs per year

### Records (6 tabs)
- **Overall** — stats table + score history chart
- **By Round** — high/low/avg per round with charts
- **Streaks** — current pick grid, all-time correct/wrong streaks, perfect rounds, best starts
- **Upsets** — prediction rates, upsets called per year, best upset calls, best upset callers
- **Games** — biggest blowout misses, most contrarian correct picks, unanimous wrong picks, best tournament accuracy

### Head to Head
- Toggle opponent selection
- Win/loss bars, overall stats, round dominance
- Year-by-year results with margin visualization
- Streaks, pick agreement (overall rate, three-way consensus, agreement by round, year trend)

### Admin (MJS only)
- Fetch Scores Now
- Advance Round
- Score Override
- First Four → R1 Fix
- Archive Season
- Initialize New Season

---

## 8. ESPN Integration

### Auto-Scorer (`/api/update-scores`)
- Runs every 2 minutes via cron-job.org
- Fetches ESPN scoreboard, matches games by team name
- Saves `espn_id`, `tipoff_time`, `status_detail`, scores
- Updates `season_results` incrementally when games finish
- First Four → R1 propagation: updates R1 placeholder team names when FF games finish

### Name Matching Pipeline
1. **Normalize:** Strip dots, special apostrophes (okina), hyphens→spaces, parentheses, lowercase
2. **Strip mascots:** 200+ mascot words (seahawks, ramblers, mocs, mustangs, etc.)
3. **Alias table:** 50+ entries mapping variations (e.g., 'hawaii' ↔ 'hawai'i', 'uconn' ↔ 'connecticut')
4. **Set intersection:** Compare word sets after normalization
5. **Skip words:** Prevents false matches on common suffixes ('state', 'university', 'college', 'tech', etc.)

### Backfill (`/api/backfill-espn`)
- Runs nightly at midnight via cron-job.org
- Matches both completed AND upcoming games (pulls tipoff times from schedule)
- Configured for years 2009–2026 (2008 has no ESPN data)
- ~99% match rate for historical data; ~6 remaining misses are source data errors

### Known ESPN Matching Issues (Resolved)
- "Michigan State" matching "Iowa State" via "state"==="state" — fixed with skipWords
- "Hawai'i" not matching "Hawaii" — fixed with okina stripping + alias
- "1st Half" triggering halftime display — fixed `formatClock` to match only exact "Halftime"/"End of"

---

## 9. Data Loaded

- 17 tournaments (2008–2025, excluding 2020) with full bracket data
- ~1,130 games with ESPN IDs and real tipoff times (2009–2025)
- ~2,392 picks across all years
- 2026 bracket loaded: 4 First Four + 32 Round 1 games, tournament status='active'
- Round schedule table populated for 2026

---

## 10. Deployment Process

### Standard Deploy
```powershell
cd C:\01-MS\Schanbacher_Tournament\code
tar -xzf PATH_TO_FILE --strip-components=1
git add .
git commit -m "description"
git push
```
Vercel auto-deploys from main branch.

### CRITICAL: Force Recompile
Next.js does NOT always detect changes in `components/App.jsx`. You MUST bump the version comment in `app/page.js` (currently `// v18`) to force recompile:
```js
'use client'
// v18  ← increment this
import App from '../components/App'
```

### Vercel Config
- `vercel.json` sets `maxDuration`: 30s for score/advance routes, 60s for backfill
- `VERCEL_FORCE_NO_BUILD_CACHE` env var may still be set — should be removed

### Tar Extraction Issues on Windows
- Browser sometimes downloads `.tar.gz` as `.tar` (no gz extension) — try both
- If `--strip-components` fails, extract to temp dir and copy manually
- File may save to unexpected locations — use `Get-ChildItem -Recurse -Filter "filename*"` to find

---

## 11. Known Bugs & Technical Debt

### Bugs
- [ ] ~6 historical spreadsheet data errors (wrong team names in 2013, 2019)
- [ ] `VERCEL_FORCE_NO_BUILD_CACHE` env var should be removed from Vercel settings

### Technical Debt
- [ ] Entire UI in one 137KB file (`App.jsx`) — should split into separate component files for productization
- [ ] Remove debug fields (`missedGames`, `remainingEspn`) from backfill response
- [ ] Sync mascot list + alias table fully between update-scores and backfill routes
- [ ] `PLAYERS_ALL` is hardcoded as `["TLS","MJS","JRS"]` — must be dynamic for multi-tenant
- [ ] Trust-based auth (click your name) must be replaced with real auth for multi-tenant
- [ ] RLS policies are fully open (public read/write) — must be tightened for multi-tenant

### Key Learnings
- **React hydration errors in Next.js:** Defer all `localStorage` reads to `useEffect`; ensure no early returns before hook declarations
- **Next.js on Vercel does NOT always detect changes in imported component files** — must touch the importing `page.js` file (bump version comment) to force recompile
- **ESPN API fuzzy matching** requires layered normalization with skipWords to prevent false matches
- **Upset stats denominators** must be scoped to years each player actually participated
- **Pick visibility must be global** across all regions, not per-region
- **`str_replace` in long files** — always verify the change persisted before packaging; Python string replaces can fail silently when the target string doesn't match exactly

---

## 12. Productization Roadmap

These items were discussed for turning the app into a sellable product:

### Must-Have for Product
- [ ] Multi-tenancy: support multiple groups, each with their own bracket pool
- [ ] Real authentication (email/password, Google OAuth, or similar)
- [ ] Dynamic player management (add/remove players, flexible group sizes)
- [ ] Admin dashboard per group (not hardcoded to MJS)
- [ ] Bracket import tool (currently games need SQL)
- [ ] Proper RLS policies scoped to user/group
- [ ] Split `App.jsx` into proper component architecture
- [ ] PWA / App Store packaging
- [ ] Payment/subscription integration

### Nice-to-Have
- [ ] Push notifications for game updates
- [ ] Export to PDF
- [ ] Public shareable bracket links
- [ ] Integration with other tournaments (NFL playoffs, World Cup, etc.)
- [ ] Chat/trash-talk feature within groups

---

## 13. Environment & Credentials

| Service | Details |
|---------|---------|
| GitHub | `github.com/mschanbacher/schanbacher-tournament` |
| Vercel | Connected to main branch, auto-deploy |
| Supabase | Project ID: `xynkeozcivjthklgrsii` |
| cron-job.org | 3 jobs running (score/advance/backfill) |
| ESPN API | Public endpoints, no auth needed |

### Cron Job URLs
- **Score update (every 2min):** `https://schanbacher-tournament.vercel.app/api/update-scores`
- **Round advance (every 5min):** `https://schanbacher-tournament.vercel.app/api/advance-round`
- **ESPN backfill (nightly):** `https://schanbacher-tournament.vercel.app/api/backfill-espn?year=2026`

---

## 14. How to Continue Development

When starting a new Claude session, share this document as context. Key things to know:

1. **The entire UI is in `components/App.jsx`** — it's one large file with all 22 components
2. **Always bump `// vN` in `app/page.js`** when changing App.jsx, or Vercel won't recompile
3. **Test tar files before sending** — verify the changes are actually in the tar with `grep` before packaging
4. **The scoring system, color scheme, and design philosophy** are documented above — maintain consistency
5. **ESPN name matching** is fragile — any new team name issues should be added to the alias table in BOTH `update-scores` AND `backfill-espn` routes
6. **Pick visibility is global per round** — don't make it per-region or per-game
7. **Dark mode must work** — all colors are in the `LIGHT`/`DARK` theme objects in App.jsx
