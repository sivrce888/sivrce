-- AlterTable
ALTER TABLE "listings"
ADD COLUMN "pets_allowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "seller_type" VARCHAR(20) NOT NULL DEFAULT 'owner';

-- Backfill: agency JSON blob on the listing implies an agency listing;
-- the pets feature vocabulary key (src/lib/features.ts) implies pets allowed.
UPDATE "listings" SET "seller_type" = 'agency' WHERE COALESCE("agent"->>'agency', '') <> '';
UPDATE "listings" SET "pets_allowed" = true WHERE 'add.f.petsAllowed' = ANY("features");

-- CreateIndex
CREATE INDEX "listings_pets_allowed_idx" ON "listings"("pets_allowed", "deleted_at");
CREATE INDEX "listings_seller_type_idx" ON "listings"("seller_type", "deleted_at");
