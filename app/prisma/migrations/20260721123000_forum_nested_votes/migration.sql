-- Nested replies (1 level) + helpful votes for forum.
ALTER TABLE "forum_replies" ADD COLUMN IF NOT EXISTS "parent_id" VARCHAR(120);
ALTER TABLE "forum_replies" ADD COLUMN IF NOT EXISTS "helpful_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "forum_replies_parent_id_idx" ON "forum_replies"("parent_id");

CREATE TABLE IF NOT EXISTS "forum_reply_votes" (
    "id" VARCHAR(120) NOT NULL,
    "reply_id" VARCHAR(120) NOT NULL,
    "voter_key" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "forum_reply_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "forum_reply_votes_reply_voter_key" ON "forum_reply_votes"("reply_id", "voter_key");
CREATE INDEX IF NOT EXISTS "forum_reply_votes_reply_id_idx" ON "forum_reply_votes"("reply_id");

DO $$ BEGIN
  ALTER TABLE "forum_reply_votes"
    ADD CONSTRAINT "forum_reply_votes_reply_id_fkey"
    FOREIGN KEY ("reply_id") REFERENCES "forum_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
