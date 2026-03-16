-- Schanbacher Tournament Challenge — Database Schema
-- Run this in your Supabase SQL Editor to set up all tables

-- Players
CREATE TABLE players (
  id TEXT PRIMARY KEY,           -- 'TLS', 'MJS', 'JRS'
  name TEXT NOT NULL,            -- 'Tom', 'Mike', 'Jack'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO players (id, name) VALUES ('TLS', 'Tom'), ('MJS', 'Mike'), ('JRS', 'Jack');

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
  UNIQUE(year, name)
);

-- Games
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  year INT REFERENCES tournaments(year),
  region_id INT REFERENCES regions(id),  -- NULL for Final Four / Championship
  round INT NOT NULL,            -- 0=play-in, 1=R1, 2=R2, 3=S16, 4=E8, 5=FF, 6=CH
  game_order INT NOT NULL,       -- Position within the round/region
  seed1 INT,                     -- Seed of team 1 (R1 only)
  team1 TEXT,
  seed2 INT,
  team2 TEXT,
  score1 INT,                    -- Final score
  score2 INT,
  winner TEXT,                   -- Team name of winner
  tipoff_time TIMESTAMPTZ,       -- When picks lock for this game
  status TEXT DEFAULT 'pending', -- 'pending', 'live', 'final'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  r1_score INT DEFAULT 0,
  r2_score INT DEFAULT 0,
  r3_score INT DEFAULT 0,       -- Sweet 16
  r4_score INT DEFAULT 0,       -- Elite 8
  r5_score INT DEFAULT 0,       -- Final Four
  r6_score INT DEFAULT 0,       -- Championship
  UNIQUE(year, player_id)
);

-- Indexes for common queries
CREATE INDEX idx_games_year_round ON games(year, round);
CREATE INDEX idx_picks_game ON picks(game_id);
CREATE INDEX idx_picks_player ON picks(player_id);
CREATE INDEX idx_season_results_year ON season_results(year);

-- Row Level Security (RLS) — we keep it simple since this is trust-based auth
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_results ENABLE ROW LEVEL SECURITY;

-- Allow public read on everything (small family app, no secrets)
CREATE POLICY "Public read" ON players FOR SELECT USING (true);
CREATE POLICY "Public read" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read" ON regions FOR SELECT USING (true);
CREATE POLICY "Public read" ON games FOR SELECT USING (true);
CREATE POLICY "Public read" ON picks FOR SELECT USING (true);
CREATE POLICY "Public read" ON season_results FOR SELECT USING (true);

-- Allow public insert/update on picks (trust-based, no auth)
CREATE POLICY "Public insert" ON picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON picks FOR UPDATE USING (true);

-- Allow public insert/update on games (for score updates)
CREATE POLICY "Public insert" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON games FOR UPDATE USING (true);

-- Allow public insert/update on tournaments
CREATE POLICY "Public insert" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON tournaments FOR UPDATE USING (true);

-- Allow public insert on regions
CREATE POLICY "Public insert" ON regions FOR INSERT WITH CHECK (true);

-- Allow public insert on season_results
CREATE POLICY "Public insert" ON season_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON season_results FOR UPDATE USING (true);
