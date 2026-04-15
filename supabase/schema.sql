-- Schanbacher Tournament Challenge — Database Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- Updated April 2026 — Phase 4A (auth + multi-tenancy foundation)

-- ============================================================================
-- IDENTITY & MULTI-TENANCY
-- ============================================================================

-- Profiles: one per authenticated user (linked to Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,                -- = auth.users.id (set on sign-up trigger)
  email TEXT,
  display_name TEXT,                  -- Full name, e.g. "Mike Schanbacher"
  default_initials TEXT,              -- Preferred short ID, e.g. "MJS"
  is_app_admin BOOLEAN DEFAULT FALSE, -- Can manage global bracket/tournaments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leagues: independent groups/pools
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                 -- "Schanbacher Family", "Office Pool 2027"
  invite_code TEXT UNIQUE,            -- Short code for joining, e.g. "SCHAN-2027"
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- League members: per-league identity (display name, colors, role)
CREATE TABLE league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,           -- "TLS", "MIKE", "J-Rod" — unique within league
  color_light TEXT,                   -- Player color for light theme (hex)
  color_dark TEXT,                    -- Player color for dark theme (hex)
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' or 'member'
  legacy_player_id TEXT,              -- Maps to old players.id during transition (drop after full migration)
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id),
  UNIQUE(league_id, display_id)
);

CREATE INDEX idx_league_members_league ON league_members(league_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);
CREATE INDEX idx_league_members_legacy ON league_members(legacy_player_id);

-- ============================================================================
-- LEGACY IDENTITY (retained during Approach B transition)
-- ============================================================================

-- Players (legacy — will be dropped after full FK migration)
CREATE TABLE players (
  id TEXT PRIMARY KEY,           -- 'TLS', 'MJS', 'JRS'
  name TEXT NOT NULL,            -- 'Tom', 'Mike', 'Jack'
  color_light TEXT,              -- Player color for light theme (hex)
  color_dark TEXT,               -- Player color for dark theme (hex)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO players (id, name, color_light, color_dark) VALUES
  ('TLS', 'Tom', '#12173F', '#6b72b3'),
  ('MJS', 'Mike', '#F04E2C', '#f27a5e'),
  ('JRS', 'Jack', '#1E4D42', '#5ba88e');

-- ============================================================================
-- GLOBAL BRACKET DATA (shared across all leagues)
-- ============================================================================

-- Tournaments (one per year)
CREATE TABLE tournaments (
  year INT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'active', 'complete'
  current_round INT DEFAULT 0,             -- 0=not started, 1-6=active round
  champion_player TEXT REFERENCES players(id), -- Legacy; will migrate to league-scoped champions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regions per tournament
CREATE TABLE regions (
  id SERIAL PRIMARY KEY,
  year INT REFERENCES tournaments(year),
  name TEXT NOT NULL,            -- 'South', 'West', 'East', 'Midwest', etc.
  position INT NOT NULL,         -- 1-4, ordering
  ff_pair INT,                   -- 1 or 2: which regions play each other in Final Four
  UNIQUE(year, name)
);

-- Games
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  year INT REFERENCES tournaments(year),
  region_id INT REFERENCES regions(id),  -- NULL for Final Four / Championship
  round INT NOT NULL,            -- 0=play-in, 1=R1, 2=R2, 3=S16, 4=E8, 5=FF, 6=CH
  game_order INT NOT NULL,       -- Position within the round/region
  seed1 INT,                     -- Seed of team 1
  team1 TEXT,
  seed2 INT,
  team2 TEXT,
  score1 INT,                    -- Final score
  score2 INT,
  winner TEXT,                   -- Team name of winner
  tipoff_time TIMESTAMPTZ,       -- When picks lock for this game
  status TEXT DEFAULT 'pending', -- 'pending', 'live', 'final'
  espn_id TEXT,                  -- ESPN game ID for linking and matching
  status_detail TEXT,            -- ESPN status detail (e.g., "1st Half", "Halftime", "Final")
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: prevents duplicate game creation at the database level
CREATE UNIQUE INDEX games_unique_slot ON games (year, round, game_order, COALESCE(region_id, -1));

-- Round schedule (earliest tipoff time per round, used for countdown timers)
CREATE TABLE round_schedule (
  id SERIAL PRIMARY KEY,
  year INT REFERENCES tournaments(year),
  round INT NOT NULL,            -- 0-6
  tipoff_time TIMESTAMPTZ,
  label TEXT                     -- Optional display label
);

-- First Four → Round 1 mappings (which R1 slot each FF winner feeds into)
CREATE TABLE first_four_mappings (
  id SERIAL PRIMARY KEY,
  year INT REFERENCES tournaments(year),
  ff_game_order INT NOT NULL,              -- First Four game index (0-3)
  target_region_id INT REFERENCES regions(id),
  target_game_order INT NOT NULL,
  target_slot INT NOT NULL,                -- 1 = team1, 2 = team2
  UNIQUE(year, ff_game_order)
);

-- ============================================================================
-- LEAGUE-SCOPED DATA (picks and results per league)
-- ============================================================================

-- Picks
CREATE TABLE picks (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id),
  player_id TEXT REFERENCES players(id),               -- Legacy FK (kept during transition)
  league_id UUID REFERENCES leagues(id),               -- New: which league this pick belongs to
  league_member_id UUID REFERENCES league_members(id), -- New: who made this pick (league-scoped)
  picked_team TEXT NOT NULL,
  points_earned INT DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id)    -- Legacy constraint; will become UNIQUE(game_id, league_member_id)
);

-- Historical summaries (for the Champions/Stats view)
CREATE TABLE season_results (
  id SERIAL PRIMARY KEY,
  year INT REFERENCES tournaments(year),
  player_id TEXT REFERENCES players(id),               -- Legacy FK (kept during transition)
  league_id UUID REFERENCES leagues(id),               -- New: which league these results belong to
  league_member_id UUID REFERENCES league_members(id), -- New: whose results (league-scoped)
  total_score INT NOT NULL,
  r1_score INT DEFAULT 0,        -- NOTE: First Four (round 0) points are merged into r1_score
  r2_score INT DEFAULT 0,
  r3_score INT DEFAULT 0,        -- Sweet 16
  r4_score INT DEFAULT 0,        -- Elite 8
  r5_score INT DEFAULT 0,        -- Final Four
  r6_score INT DEFAULT 0,        -- Championship
  UNIQUE(year, player_id)        -- Legacy constraint; will become UNIQUE(year, league_member_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_games_year_round ON games(year, round);
CREATE INDEX idx_picks_game ON picks(game_id);
CREATE INDEX idx_picks_player ON picks(player_id);
CREATE INDEX idx_picks_league ON picks(league_id);
CREATE INDEX idx_picks_league_member ON picks(league_member_id);
CREATE INDEX idx_season_results_year ON season_results(year);
CREATE INDEX idx_season_results_league ON season_results(league_id);
CREATE INDEX idx_season_results_league_member ON season_results(league_member_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_four_mappings ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies (will be tightened in Phase 4A Step 5)
CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read" ON leagues FOR SELECT USING (true);
CREATE POLICY "Public read" ON league_members FOR SELECT USING (true);
CREATE POLICY "Public read" ON players FOR SELECT USING (true);
CREATE POLICY "Public read" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read" ON regions FOR SELECT USING (true);
CREATE POLICY "Public read" ON games FOR SELECT USING (true);
CREATE POLICY "Public read" ON picks FOR SELECT USING (true);
CREATE POLICY "Public read" ON season_results FOR SELECT USING (true);
CREATE POLICY "Public read" ON round_schedule FOR SELECT USING (true);
CREATE POLICY "Public read" ON first_four_mappings FOR SELECT USING (true);

-- Temporary permissive write policies
CREATE POLICY "Public insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Public insert" ON leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON leagues FOR UPDATE USING (true);
CREATE POLICY "Public insert" ON league_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON league_members FOR UPDATE USING (true);
CREATE POLICY "Public insert" ON picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON picks FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON picks FOR DELETE USING (true);
CREATE POLICY "Public insert" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON games FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON games FOR DELETE USING (true);
CREATE POLICY "Public insert" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON tournaments FOR DELETE USING (true);
CREATE POLICY "Public insert" ON regions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete" ON regions FOR DELETE USING (true);
CREATE POLICY "Public insert" ON season_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON season_results FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON season_results FOR DELETE USING (true);
CREATE POLICY "Public insert" ON round_schedule FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON round_schedule FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON round_schedule FOR DELETE USING (true);
CREATE POLICY "Public insert" ON first_four_mappings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON first_four_mappings FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON first_four_mappings FOR DELETE USING (true);
