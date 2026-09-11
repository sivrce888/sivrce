-- AlterTable
ALTER TABLE "listings" ADD COLUMN "country" VARCHAR(8) NOT NULL DEFAULT 'GE';

-- CreateIndex
CREATE INDEX "listings_country_idx" ON "listings"("country", "deleted_at");
