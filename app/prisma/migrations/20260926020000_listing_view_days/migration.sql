-- Daily view rollup for "today X · yesterday Y" on listing detail (SS.ge parity).
CREATE TABLE "listing_view_days" (
    "id" BIGSERIAL PRIMARY KEY,
    "listing_id" VARCHAR(120) NOT NULL,
    "day" DATE NOT NULL,
    "count" INT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "listing_view_day_key" ON "listing_view_days"("listing_id", "day");
