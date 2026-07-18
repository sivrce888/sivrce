-- AlterTable developer_profiles
ALTER TABLE "developer_profiles" ADD COLUMN IF NOT EXISTS "website" VARCHAR(200);
ALTER TABLE "developer_profiles" ADD COLUMN IF NOT EXISTS "logo_url" VARCHAR(320);

-- AlterTable project_directories
ALTER TABLE "project_directories" ADD COLUMN IF NOT EXISTS "address" VARCHAR(240);
ALTER TABLE "project_directories" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "project_directories" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "project_directories" ADD COLUMN IF NOT EXISTS "source_url" VARCHAR(320);
ALTER TABLE "project_directories" ALTER COLUMN "image" SET DATA TYPE VARCHAR(320);

CREATE INDEX IF NOT EXISTS "project_directories_coords_idx" ON "project_directories"("lat", "lng");
