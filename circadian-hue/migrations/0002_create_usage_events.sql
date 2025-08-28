CREATE TABLE IF NOT EXISTS "usage_events" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_type" text NOT NULL,
    "details" jsonb,
    "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_usage_events_created_at" ON "usage_events"("created_at");
