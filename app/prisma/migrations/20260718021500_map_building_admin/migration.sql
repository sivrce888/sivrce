-- AlterTable
ALTER TABLE "map_buildings" ADD COLUMN     "address" VARCHAR(240),
ADD COLUMN     "building_number" VARCHAR(12),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "code" VARCHAR(20),
ADD COLUMN     "developer_id" VARCHAR(120),
ADD COLUMN     "district" VARCHAR(120),
ADD COLUMN     "floors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "img" VARCHAR(260),
ADD COLUMN     "popular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" VARCHAR(140) NOT NULL,
ADD COLUMN     "title_en" VARCHAR(180),
ADD COLUMN     "year_built" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "map_buildings_slug_key" ON "map_buildings"("slug");

-- CreateIndex
CREATE INDEX "map_buildings_popular_idx" ON "map_buildings"("popular", "status");

-- AddForeignKey
ALTER TABLE "map_buildings" ADD CONSTRAINT "map_buildings_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "developer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

