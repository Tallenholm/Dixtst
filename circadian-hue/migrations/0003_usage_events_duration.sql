ALTER TABLE "usage_events" ADD COLUMN "duration" integer;
CREATE INDEX IF NOT EXISTS "idx_usage_events_event_type" ON "usage_events"("event_type");
