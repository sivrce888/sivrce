-- MyHome-style public listing numbers (searchable 8-digit IDs).
CREATE SEQUENCE IF NOT EXISTS listings_public_id_seq START WITH 10000001 INCREMENT BY 1;

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "public_id" INTEGER;

UPDATE "listings"
SET "public_id" = nextval('listings_public_id_seq')
WHERE "public_id" IS NULL;

ALTER TABLE "listings" ALTER COLUMN "public_id" SET DEFAULT nextval('listings_public_id_seq');
ALTER TABLE "listings" ALTER COLUMN "public_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "listings_public_id_key" ON "listings"("public_id");
