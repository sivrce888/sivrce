-- Activity heartbeat + first-touch acquisition attribution (admin statistics).
ALTER TABLE "users" ADD COLUMN "last_seen_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN "signup_source" VARCHAR(80);
CREATE INDEX "users_last_seen_at_idx" ON "users"("last_seen_at");
