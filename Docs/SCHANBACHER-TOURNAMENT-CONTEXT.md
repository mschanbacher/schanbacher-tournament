# Schanbacher Tournament Challenge — Project Context

> **Last updated:** March 21, 2026 (Round 1 complete, Round 2 underway)
> **Purpose:** Reference document for continuing development across chat sessions.

---

## Overview

A private March Madness bracket competition web app for a small family group. Currently 3 players (TLS/Tom, MJS/Mike, JRS/Jack). MJS is the admin user. The app is a polished, feature-rich tool with historical records, rivalry stats, and live tournament experience. Mike plans to productize this for broader distribution (App Store / multi-tenancy) after the 2026 tournament.

---

## Architecture

| Component | Technology | Details |
|-----------|-----------|---------|
| Frontend | Next.js 14.2 | Single `components/App.jsx` (~1,764 lines), all client-side rendering |
| Deployment | Vercel | Auto-deploys from `main` branch on GitHub |
| Database | Supabase (PostgreSQL) | Project ID: `xynkeozcivjthklgrsii` |
| Scoring | ESPN public API | Auto-scorer via cron-job.org every 2 min |
| Auth | Trust-based | Click-your-name login, localStorage "remember me" |
| Repo | GitHub | `github.com/mschanbacher/schanbacher-tournament` (public) |
| Analytics | Vercel Analytics | `@vercel/analytics/next` in layout.js |

---

## File Structure

```
schanbacher-tournament/
├── app/
│   ├── page.js                          # 'use client' wrapper, imports App.jsx
│   ├── layout.js                        # Root layout with Vercel Analytics
│   ├── globals.css                      # Minimal global CSS
│   └── api/
│       ├── update-scores/route.js       # ESPN auto-scorer (345 lines)
│       ├── advance-round/route.js       # Round advancement (112 lines)
│       └── backfill-espn/route.js       # Historical ESPN backfill (316 lines)
├── components/
│   └── App.jsx                          # Entire UI (~1,764 lines, single file)
├── lib/
│   ├── queries.js                       # Supabase data fetching layer
│   └── supabase.js                      # Supabase client init
├── supabase/
│   ├── schema.sql                       # Full DB schema
│   └── seed_history.sql                 # Historical data (2008-2025)
├── next.config.js
├── package.json
└── vercel.json                          # Route-level maxDuration config
```

---

## Database Schema

### Tables

**players** — `id` (TEXT PK: 'TLS','MJS','JRS'), `name`, `created_at`

**tournaments** — `year` (INT PK), `status` ('pending'|'active'|'complete'), `current_round`, `champion_player`

**regions** — `id` (SERIAL), `year`, `name`, `position` (1-4)

**games** — `id` (SERIAL), `year`, `region_id`, `round` (0=play-in, 1-6), `game_order`, `seed1`, `team1`, `seed2`, `team2`, `score1`, `score2`, `winner`, `tipoff_time`, `status` ('pending'|'live'|'final'), `espn_id`, `status_detail`

**picks** — `id` (SERIAL), `game_id`, `player_id`, `picked_team`, `points_earned`, `submitted_at`; UNIQUE(game_id, player_id)

**season_results** — `id` (SERIAL), `year`, `player_id`, `total_score`, `r1_score` through `r6_score`; UNIQUE(year, player_id)

**round_schedule** — `id` (SERIAL), `year`, `round`, `tipoff_time`, `label`

### Columns added after initial schema (not in schema.sql)
- `games.espn_id` (TEXT) — ESPN game identifier
- `games.status_detail` (TEXT) — ESPN status string like "12:41 - 2nd Half"
- `round_schedule` table — added for round advancement scheduling

### RLS Policies
- Public read on all tables
- Public insert/update on picks, games, tournaments, regions, season_results
- Public delete on picks (needed for "Clear Picks" feature)

---

## Scoring System

| Round | Points per correct pick | Max possible |
|-------|------------------------|-------------|
| First Four | 1 | 4 |
| Round 1 | 1 | 32 |
| Round 2 | 2 | 32 |
| Sweet 16 | 3 | 24 |
| Elite 8 | 4 | 16 |
| Final Four | 5 | 10 |
| Championship | 6 | 6 |

Total possible: 124 points (including First Four)

---

## Design System

**Philosophy:** Dieter Rams inspired. Clean, minimal, zero border-radius, no emoji.

**Typography:** Suisse Int'l / Helvetica Neue, tabular numerals throughout.

**Color scheme:**

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | #f5f3ef | #1a1a18 |
| Surface | #ffffff | #242422 |
| Text | #1a1a1a | #e0ddd6 |
| TLS color | #12173F (navy) | #6b72b3 |
| MJS color | #F04E2C (orange-red) | #f27a5e |
| JRS color | #1E4D42 (forest green) | #5ba88e |
| Correct | #2a6e3f | #2a6e3f |
| Wrong | #c43e1c | #c43e1c |
| Split indicator | #C6982B (gold) | #C6982B |

**Settings:** Font size scaling (S/M/L/XL via CSS zoom) and dark mode toggle, both persisted to localStorage.

---

## App Pages & Components

### 1. Dashboard
- **Status bar:** Evolving states (pre-tournament → live → round-complete → champion), persistent leaderboard
- **Live games section:** Shows in-progress games using GameCell components, 2-column grid on desktop, 1-column mobile. Auto-refreshes with 30-second polling. Only renders when games are live — no empty state.
- **Pick-by-pick grid:** Color-coded cells (green=correct, red=wrong) for each player's sequential picks, sorted by tipoff time for stable chronological order. Hover tooltip shows game details (winner, score, player's pick, ✓/✗).
- **Standings bars and round breakdown table**
- **All-time championship counts**

### 2. Bracket
- **Region tabs** (First Four, East, West, Midwest, South, Final Four)
- **Game cells** with: 44px time column (tipoff time + day abbreviation, or "Final", or live clock with pulsing red dot), 24px gold split bar for disagreed picks, 200px game area, 24px points column
- **Live scores:** Red border, pulsing dot, game clock + period indicator, 30-second auto-refresh
- **Pick visibility:** Global round lock — once ANY game in a round tips off across ANY region, all picks for that round become visible everywhere
- **ESPN box score links** on completed games
- **"Final" label** on completed games

### 3. Picks
- Round tabs, pick selection UI, submit button
- Clear picks button (hidden after tipoff lock)
- Countdown timer per round
- Auto-submit detection on last pick

### 4. History
- Table of all years (2008-2025 + 2026)
- Drill into Scores + Bracket tabs per year

### 5. Records — 6 tabs
- **Overall:** Stats table + score history chart
- **By Round:** High/low/avg with per-round charts
- **Streaks:** Current pick grid, all-time correct/wrong streaks, perfect rounds, best starts
- **Upsets:** Prediction rates, upsets called per year, best upset calls
- **Games:** Biggest blowout misses (ranked by margin, shows who missed with colored pills), most contrarian correct picks (lone wolf who got it right), unanimous wrong picks (everyone picked the loser), best tournament accuracy (% correct picks per tournament per player, separate from point-based scoring)

### 6. Head to Head (H2H)
- Defaults to logged-in player, toggle opponent
- Win/loss bars, overall stats, round dominance
- Year-by-year with margin visualization, streaks
- Pick agreement (overall rate, three-way consensus, agreement by round, year trend)

### 7. Settings
- Font size scaling (S/M/L/XL)
- Dark mode toggle
- Both persisted to localStorage

### 8. Admin (MJS only)
- Fetch Scores Now
- Advance Round
- Score Override
- First Four → R1 Fix
- Archive Season
- Initialize New Season

---

## API Routes

### `/api/update-scores` (cron every 2 min)
- Fetches ESPN scoreboard for **yesterday, today, and tomorrow** — this means it automatically picks up tipoff times for upcoming games as soon as ESPN publishes the next day's schedule
- Matches ESPN games to DB games using a three-tier strategy:
  1. **Seed-based matching** (primary) — matches by tournament seed pairs (e.g., 1-seed vs 16-seed). Unambiguous for R1 through E8. Future-proof against school name variations.
  2. **ESPN ID matching** — if a game was previously matched and has an `espn_id`, uses that directly
  3. **Name matching** (fallback) — fuzzy name matching for edge cases (Final Four where seed pairs could overlap across regions)
- Updates: score1, score2, status, status_detail, espn_id, tipoff_time
- Propagates First Four winners into Round 1 placeholder slots
- Incrementally updates season_results when games finish
- **Name matching pipeline** (fallback only): normalize (strip dots, special apostrophes including okina ʻ, hyphens→spaces, parentheses, lowercase) → stripMascot (200+ mascot words) → alias table (50+ entries including Hawaii/Hawai'i, Cal Baptist/California Baptist, LIU/Long Island University) → Set-based intersection matching
- **skipWords:** Set of common suffixes ("state", "university", "college", "tech", "city", etc.) excluded from last-word fallback matching to prevent cross-matches (e.g., Michigan State ≠ Iowa State)

### `/api/advance-round` (cron every 5 min)
- Creates next-round matchups when current round is complete (all games `status = 'final'`)
- Uses round_schedule table for placeholder tipoff times (real times updated by auto-scorer's tomorrow check)
- Groups winners by region and pairs them by `game_order` for bracket-correct matchups
- Handles R1→R2 through E8→FF→Championship progression
- First Four → R1 propagation handled by update-scores route, not advance-round
- **Important:** `tournaments.current_round` must be set correctly for advancement to work. If round doesn't advance, check this value.

### `/api/backfill-espn` (cron hourly, or on-demand)
- Backfills ESPN IDs and tipoff times for historical + upcoming games
- Matches both completed and upcoming games (not just completed)
- Uses same three-tier matching strategy as update-scores (seeds → ESPN ID → names)
- Configured dates: 2009-2026 (2008 has no ESPN data)
- Match rate: ~99% for historical years, ~6 remaining misses are source data errors
- **Largely superseded by auto-scorer's tomorrow check** — the auto-scorer now picks up upcoming game times automatically. Backfill is still useful for bulk historical operations or catching games more than 1 day out.

---

## Cron Jobs (cron-job.org)

| Job | URL | Frequency | Notes |
|-----|-----|-----------|-------|
| Score updates | `/api/update-scores` | Every 2 minutes | Also fetches tomorrow's schedule for tipoff times |
| Round advancement | `/api/advance-round` | Every 5 minutes | Creates next-round games when all current round games are final |
| ESPN backfill | `/api/backfill-espn?year=2026` | Hourly | Mostly redundant now; auto-scorer handles upcoming games |

**All cron job URLs must use `https://` not `http://`** — Vercel returns 308 redirect on HTTP.

---

## Historical Data

- **17 tournaments** loaded: 2008-2025 (excluding 2020/COVID)
- **~1,130 games** with full bracket data
- **~2,392 picks** across all years and players
- **ESPN backfill:** 2009-2025 matched at ~99% accuracy (ESPN IDs + real tipoff times)
- **2008:** No ESPN API data available
- **~6 remaining misses:** Source data errors in spreadsheet (wrong team names for Houston/Georgia Southern 2019, Colorado/Miami 2013, etc.)

---

## Deployment Process

```powershell
# From C:\01-MS\Schanbacher_Tournament\code
tar -xzf PATH_TO_FILE --strip-components=1
git add .
git commit -m "description"
git push
```

**CRITICAL:** Next.js does NOT always detect changes in `components/App.jsx`. Must bump the version comment in `app/page.js` (currently `// v18`) to force recompile. This is the `// vN` pattern — increment N each deploy.

**Vercel:** `VERCEL_FORCE_NO_BUILD_CACHE` env var may still be set — should be removed for normal deploys.

---

## Known Issues & Technical Debt

### Bugs to fix
- ~6 historical spreadsheet data errors (wrong team names in certain years)
- Remove debug fields from advance-round response (added for troubleshooting, can be removed)
- Remove `VERCEL_FORCE_NO_BUILD_CACHE` env var from Vercel settings
- Seed-based matching doesn't work for Final Four/Championship (seed pairs aren't unique across regions) — name matching is the fallback there

### Code quality
- Sync mascot list + alias table fully between update-scores and backfill routes (currently maintained separately)
- `schema.sql` doesn't include `espn_id`, `status_detail`, or `round_schedule` table — need to update
- Single 1,764-line `App.jsx` should be split into separate component files for maintainability (required before productization)

### React/Next.js patterns
- All localStorage reads deferred to `useEffect` to prevent hydration errors
- All hooks declared before any early returns in components
- `page.js` version comment (`// vN`) must be bumped for deploys

---

## Key Learnings & Patterns

1. **React hydration errors in Next.js:** Always defer localStorage reads to `useEffect`. Ensure no early returns precede hook declarations.

2. **ESPN matching — seed-based is best:** The primary matching strategy should be seed pairs (1v16, 2v15, etc.) which are unambiguous for R1-E8. Name matching is a lossy fallback. This eliminates issues with abbreviations (LIU vs Long Island University), special characters (Hawai'i), and regional names (Cal Baptist vs California Baptist).

3. **ESPN API name matching (fallback):** Requires layered normalization — mascot stripping → hyphen/apostrophe normalization → parentheses stripping → alias expansion via Set intersection. The `skipWords` set prevents false matches on common suffixes like "state" (Michigan State ≠ Iowa State).

4. **ESPN auto-scorer must check tomorrow:** Only checking today's scoreboard misses upcoming game tipoff times. Checking yesterday + today + tomorrow ensures tipoff times are populated as soon as ESPN publishes them (usually evening before).

5. **Round advancement requires `tournaments.current_round`:** The advance-round logic checks this value. If rounds aren't advancing despite all games being final, check that `current_round` is set correctly.

6. **Manual game updates need pick scoring:** When manually updating a game via SQL (setting winner, scores, status), you must ALSO update `picks.points_earned` and recalculate `season_results`. The auto-scorer does this automatically, but manual SQL updates bypass it.

7. **ESPN "Hawai'i":** The okina character (ʻ) must be normalized. Added to alias table and normalize function strips special apostrophes.

8. **Upset stats denominators:** Must be scoped to years each player actually participated.

9. **ESPN API coverage:** No data for 2008. Status detail format: "12:41 - 2nd Half", "Halftime", "End of 1st Half", "Final". ESPN uses "1st Half"/"2nd Half" as period names — don't confuse with "Halftime".

10. **Next.js on Vercel build caching:** Changes to imported component files (`App.jsx`) are NOT always detected. Must modify the importing `page.js` file to force recompile — bump the `// vN` comment (currently v19).

11. **Pick visibility:** Must be global across regions. Once ANY R1 game tips off in ANY region, ALL R1 picks in ALL regions become visible. Computed via `regionRoundLocks` in `BracketDisplay`.

12. **Dashboard pick-by-pick ordering:** Must sort `finalGames` by `tipoff_time` for stable chronological order. Without this, the grid shuffles as games finish out of bracket order.

13. **Tar extraction on Windows:** Files sometimes download without `.gz` extension. Check actual location with `Get-ChildItem`. If `--strip-components` fails, extract to temp dir and copy manually.

14. **Variable scoping across components:** When adding features that cross component boundaries (e.g., `regionRoundLocks`, `currentPlayer` in Dashboard), verify the variable is defined in the correct function scope. The single-file architecture makes this easy to miss.

15. **Cron job URLs must use HTTPS:** Vercel returns 308 Permanent Redirect on HTTP URLs. All cron-job.org URLs must use `https://`.

---

## Productization Roadmap (Post-2026 Tournament)

### Must-have for distribution
- Multi-tenancy: support multiple groups/leagues, not just one family
- User authentication (replace trust-based click-your-name)
- Dynamic player management (add/remove players, not hardcoded)
- Admin panel for creating leagues, inviting players
- Bracket import tool (currently games loaded via SQL)
- Split `App.jsx` into separate component files

### Nice-to-have
- PWA / App Store packaging
- Push notifications
- Export to PDF
- Custom scoring rules per league
- Public/shareable bracket views

### Revenue model
- Discussed as potential passive income / small SaaS product
- Target audience: families and friend groups who run bracket pools

---

## Environment Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://xynkeozcivjthklgrsii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
VERCEL_FORCE_NO_BUILD_CACHE=1  ← REMOVE THIS after confirming deploys work
```

---

## Quick Reference: Common Tasks

**Deploy a code change:**
1. Extract tar with `--strip-components=1`
2. Bump `// vN` in `app/page.js` (currently v19)
3. `git add . && git commit -m "msg" && git push`

**Manually score a game ESPN missed:**
```sql
-- Step 1: Update the game
UPDATE games SET score1=X, score2=Y, winner='Team', status='final', status_detail='Final' WHERE id=GAME_ID;

-- Step 2: Score the picks (CRITICAL — don't forget this!)
UPDATE picks SET points_earned = CASE WHEN picked_team = 'WinnerName' THEN POINTS_FOR_ROUND ELSE 0 END WHERE game_id=GAME_ID;

-- Step 3: Recalculate season_results
UPDATE season_results sr SET 
  r1_score = (SELECT COALESCE(SUM(p.points_earned), 0) FROM picks p JOIN games g ON p.game_id = g.id WHERE g.year = 2026 AND g.round = 1 AND p.player_id = sr.player_id),
  total_score = (SELECT COALESCE(SUM(p.points_earned), 0) FROM picks p JOIN games g ON p.game_id = g.id WHERE g.year = 2026 AND p.player_id = sr.player_id)
WHERE sr.year = 2026;
```

**Force ESPN re-fetch:**
Hit `https://schanbacher-tournament.vercel.app/api/update-scores` directly

**Backfill tipoff times for upcoming games:**
Hit `https://schanbacher-tournament.vercel.app/api/backfill-espn?year=2026`
(Mostly unnecessary now — auto-scorer checks tomorrow's schedule automatically)

**Trigger round advancement:**
Hit `https://schanbacher-tournament.vercel.app/api/advance-round`
If it returns empty `gamesCreated`, check `tournaments.current_round` matches the completed round.

**Check for name matching issues:**
```sql
SELECT id, team1, team2, espn_id, status FROM games WHERE year=2026 AND status='pending' AND espn_id IS NULL;
```

**Fix `tournaments.current_round` if rounds aren't advancing:**
```sql
UPDATE tournaments SET current_round = N WHERE year = 2026;
-- Then hit /api/advance-round
```
