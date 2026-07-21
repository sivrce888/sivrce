-- Forum threads need body/excerpt so users can open real topics (was metadata-only).
ALTER TABLE "forum_threads" ADD COLUMN IF NOT EXISTS "excerpt" VARCHAR(320) NOT NULL DEFAULT '';
ALTER TABLE "forum_threads" ADD COLUMN IF NOT EXISTS "body" TEXT NOT NULL DEFAULT '';
ALTER TABLE "forum_threads" ADD COLUMN IF NOT EXISTS "category" VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE "forum_threads" ADD COLUMN IF NOT EXISTS "author_name" VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE "forum_threads" ADD COLUMN IF NOT EXISTS "badge" VARCHAR(40) NOT NULL DEFAULT '';
ALTER TABLE "forum_threads" ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;
