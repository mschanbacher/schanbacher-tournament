-- Schanbacher Tournament Challenge — Database Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- Updated April 2026 to match production (Phase 2)

-- Players
CREATE TABLE players (
  id TEXT PRIMARY KEY,           -- 'TLS', 'MJS', 'JRS'
  name TEXT NOT NULL,            -- 'Tom', 'Mike', 'Jack'
  color_light TEXT,              -- Player color for light theme (hex)
  color_dark TEXT,               -- Player color for dark theme (hex)
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- TODO (Phase 5+): Add admin UI for managing players (add/remove/change colors)
);

INSERT INTO players (id, name, color_light, color_dark) VALUES
  ('TLS', 'Tom', '#12173F', '#6b72b3'),
  ('MJS', 'Mike', '#F04E2C', '#f27a5e'),
  ('JRS', 'Jack', '#1E4D42', '#5ba88e');

-- Tournaments (one per year)
CREATE TABLE tournaments (
  year INT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'active', 'complete'
  current_round INT DEFAULT 0,             -- 0=not started, 1-6=active round
  champion_player TEXT REFERENCES players(id),
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
-- Uses COALESCE(region_id, -1) because FF/Championship games have NULL region_id
CREATE UNIQUE INDEX games_unique_slot ON games (year, round, game_order, COALESCE(region_id, -1));

-- Picks
CREATE TABLE picks (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id),
  player_id TEXT REFERENCES players(id),
  picked_team TEXT NOT NULL,
  points_earned INT DEFAULT 0,   -- Calculated after game finishes
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);

-- Historical summaries (for the Champions/Stats view)
CREATE TABLE season_results (
  id SERIAL PRIMARY KEY,
  year INT REFERENCES tournaments(year),
  player_id TEXT REFERENCES players(id),
  total_score INT NOT NULL,
  r1_score INT DEFAULT 0,        -- NOTE: First Four (round 0) points are merged into r1_score
  r2_score INT DEFAULT 0,
  r3_score INT DEFAULT 0,        -- Sweet 16
  r4_score INT DEFAULT 0,        -- Elite 8
  r5_score INT DEFAULT 0,        -- Final Four
  r6_score INT DEFAULT 0,        -- Championship
  UNIQUE(year, player_id)
);

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
  target_region_id INT REFERENCES regions(id),  -- R1 region the winner goes to
  target_game_order INT NOT NULL,          -- R1 game_order within that region
  target_slot INT NOT NULL,                -- 1 = winner becomes team1, 2 = team2
  UNIQUE(year, ff_game_order)
);

-- Indexes for common queries
CREATE INDEX idx_games_year_round ON games(year, round);
CREATE INDEX idx_picks_game ON picks(game_id);
CREATE INDEX idx_picks_player ON picks(player_id);
CREATE INDEX idx_season_results_year ON season_results(year);

-- Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_four_mappings ENABLE ROW LEVEL SECURITY;

-- Allow public read on everything (small family app, no secrets)
CREATE POLICY "Public read" ON players FOR SELECT USING (true);
CREATE POLICY "Public read" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read" ON regions FOR SELECT USING (true);
CREATE POLICY "Public read" ON games FOR SELECT USING (true);
CREATE POLICY "Public read" ON picks FOR SELECT USING (true);
CREATE POLICY "Public read" ON season_results FOR SELECT USING (true);
CREATE POLICY "Public read" ON round_schedule FOR SELECT USING (true);

-- Allow public insert/update/delete on picks (trust-based, no auth)
CREATE POLICY "Public insert" ON picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON picks FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON picks FOR DELETE USING (true);

-- Allow public insert/update/delete on games (for score updates + test cleanup)
CREATE POLICY "Public insert" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON games FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON games FOR DELETE USING (true);

-- Allow public insert/update/delete on tournaments
CREATE POLICY "Public insert" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON tournaments FOR DELETE USING (true);

-- Allow public insert/delete on regions
CREATE POLICY "Public insert" ON regions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete" ON regions FOR DELETE USING (true);

-- Allow public insert/update/delete on season_results
CREATE POLICY "Public insert" ON season_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON season_results FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON season_results FOR DELETE USING (true);

-- Allow public operations on round_schedule
CREATE POLICY "Public insert" ON round_schedule FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON round_schedule FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON round_schedule FOR DELETE USING (true);

-- Allow public operations on first_four_mappings
CREATE POLICY "Public read" ON first_four_mappings FOR SELECT USING (true);
CREATE POLICY "Public insert" ON first_four_mappings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON first_four_mappings FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON first_four_mappings FOR DELETE USING (true);
