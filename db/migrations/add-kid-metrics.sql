-- Add batting metrics table
CREATE TABLE IF NOT EXISTS batting_metrics (
  id SERIAL PRIMARY KEY,
  academy_id INTEGER REFERENCES academies(id),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  footwork INTEGER CHECK (footwork >= 1 AND footwork <= 5),
  shot_selection INTEGER CHECK (shot_selection >= 1 AND shot_selection <= 5),
  bat_swing_path INTEGER CHECK (bat_swing_path >= 1 AND bat_swing_path <= 5),
  balance_posture INTEGER CHECK (balance_posture >= 1 AND balance_posture <= 5),
  coach_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add bowling metrics table
CREATE TABLE IF NOT EXISTS bowling_metrics (
  id SERIAL PRIMARY KEY,
  academy_id INTEGER REFERENCES academies(id),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  run_up_rhythm INTEGER CHECK (run_up_rhythm >= 1 AND run_up_rhythm <= 5),
  load_gather INTEGER CHECK (load_gather >= 1 AND load_gather <= 5),
  release_consistency INTEGER CHECK (release_consistency >= 1 AND release_consistency <= 5),
  line_length INTEGER CHECK (line_length >= 1 AND line_length <= 5),
  coach_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add fielding metrics table
CREATE TABLE IF NOT EXISTS fielding_metrics (
  id SERIAL PRIMARY KEY,
  academy_id INTEGER REFERENCES academies(id),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  throwing_accuracy INTEGER CHECK (throwing_accuracy >= 1 AND throwing_accuracy <= 5),
  catching INTEGER CHECK (catching >= 1 AND catching <= 5),
  ground_fielding INTEGER CHECK (ground_fielding >= 1 AND ground_fielding <= 5),
  coach_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add discipline metrics table
CREATE TABLE IF NOT EXISTS discipline_metrics (
  id SERIAL PRIMARY KEY,
  academy_id INTEGER REFERENCES academies(id),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  focus INTEGER CHECK (focus >= 1 AND focus <= 5),
  teamwork INTEGER CHECK (teamwork >= 1 AND teamwork <= 5),
  coachability INTEGER CHECK (coachability >= 1 AND coachability <= 5),
  coach_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add coach notes table
CREATE TABLE IF NOT EXISTS coach_notes (
  id SERIAL PRIMARY KEY,
  academy_id INTEGER REFERENCES academies(id),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id INTEGER NOT NULL REFERENCES users(id),
  session_id INTEGER,
  note_date DATE NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_batting_metrics_player_id ON batting_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_batting_metrics_record_date ON batting_metrics(record_date);

CREATE INDEX IF NOT EXISTS idx_bowling_metrics_player_id ON bowling_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_bowling_metrics_record_date ON bowling_metrics(record_date);

CREATE INDEX IF NOT EXISTS idx_fielding_metrics_player_id ON fielding_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_fielding_metrics_record_date ON fielding_metrics(record_date);

CREATE INDEX IF NOT EXISTS idx_discipline_metrics_player_id ON discipline_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_discipline_metrics_record_date ON discipline_metrics(record_date);

CREATE INDEX IF NOT EXISTS idx_coach_notes_player_id ON coach_notes(player_id);
CREATE INDEX IF NOT EXISTS idx_coach_notes_note_date ON coach_notes(note_date);
