-- Create training_sessions table for storing training session data
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 80),
  age_group TEXT NOT NULL CHECK (age_group IN ('Under 10s', 'Under 12s', 'Under 14s', 'Under 16s', 'Under 19s', 'Open')),
  location TEXT NOT NULL CHECK (length(location) >= 1),
  start_utc TIMESTAMPTZ NOT NULL,
  end_utc TIMESTAMPTZ NOT NULL CHECK (end_utc > start_utc),
  max_attendees INTEGER NOT NULL DEFAULT 20 CHECK (max_attendees >= 1 AND max_attendees <= 200),
  notes TEXT,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_start_utc ON training_sessions(start_utc);
CREATE INDEX IF NOT EXISTS idx_training_sessions_age_group ON training_sessions(age_group);
CREATE INDEX IF NOT EXISTS idx_training_sessions_created_by ON training_sessions(created_by);

-- Add comments
COMMENT ON TABLE training_sessions IS 'Stores training session information with UTC timestamps';
COMMENT ON COLUMN training_sessions.age_group IS 'Age group category for the session';
COMMENT ON COLUMN training_sessions.start_utc IS 'Session start time in UTC';
COMMENT ON COLUMN training_sessions.end_utc IS 'Session end time in UTC';
COMMENT ON COLUMN training_sessions.created_by IS 'User ID of the session creator';
