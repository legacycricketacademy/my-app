-- Create settings table for storing JSON configuration
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Add comment
COMMENT ON TABLE settings IS 'Stores application settings as JSON blobs keyed by string identifiers';
COMMENT ON COLUMN settings.key IS 'Unique identifier for settings (e.g., academy.profile, parent:{userId}.notifications)';
COMMENT ON COLUMN settings.value IS 'JSON blob containing the settings data';

