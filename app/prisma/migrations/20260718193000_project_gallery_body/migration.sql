-- Local directory ownership: gallery + editorial body + passport (floor plan) URL.
ALTER TABLE "project_directories" ADD COLUMN IF NOT EXISTS "gallery" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "project_directories" ADD COLUMN IF NOT EXISTS "body" TEXT;
ALTER TABLE "project_directories" ADD COLUMN IF NOT EXISTS "passport_url" VARCHAR(320);
