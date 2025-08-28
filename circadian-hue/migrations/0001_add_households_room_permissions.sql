CREATE TABLE IF NOT EXISTS "households" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "household_id" varchar REFERENCES "households"("id");

CREATE TABLE IF NOT EXISTS "room_permissions" (
    "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "room_id" varchar NOT NULL,
    "can_toggle" boolean DEFAULT false,
    "can_schedule" boolean DEFAULT false,
    PRIMARY KEY ("user_id", "room_id")
);
