-- Display ads: admin-owned creatives per slot (homepage, search, listing, dirs).
CREATE TABLE "ad_banners" (
    "id" VARCHAR(120) NOT NULL,
    "slot" VARCHAR(40) NOT NULL,
    "format" VARCHAR(20) NOT NULL DEFAULT 'billboard',
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "title" VARCHAR(180) NOT NULL,
    "subtitle" VARCHAR(280),
    "cta_label" VARCHAR(80),
    "href" VARCHAR(500) NOT NULL,
    "image_url" TEXT,
    "advertiser" VARCHAR(120),
    "audiences" TEXT[] DEFAULT ARRAY['all']::TEXT[],
    "langs" TEXT[] DEFAULT ARRAY['all']::TEXT[],
    "weight" INTEGER NOT NULL DEFAULT 10,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" VARCHAR(120),

    CONSTRAINT "ad_banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ad_banners_slot_status_idx" ON "ad_banners"("slot", "status");
CREATE INDEX "ad_banners_live_window_idx" ON "ad_banners"("status", "starts_at", "ends_at");
