-- Add unique constraint on (year, event) for timeline_events
-- Required for ON CONFLICT upsert in seed
CREATE UNIQUE INDEX IF NOT EXISTS timeline_events_year_event_unique ON timeline_events (year, event);
