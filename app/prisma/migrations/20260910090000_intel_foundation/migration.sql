-- CreateTable
CREATE TABLE "intel_sources" (
    "slug" VARCHAR(120) NOT NULL,
    "country" VARCHAR(4) NOT NULL DEFAULT '*',
    "kind" VARCHAR(40) NOT NULL DEFAULT 'unknown',
    "name" VARCHAR(200) NOT NULL,
    "base_url" TEXT,
    "facts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "refresh_hours" INTEGER NOT NULL DEFAULT 168,
    "access" VARCHAR(16) NOT NULL DEFAULT 'html',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_crawled_at" TIMESTAMPTZ(6),
    "last_ok_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intel_sources_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "intel_facts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_kind" VARCHAR(40) NOT NULL,
    "entity_id" VARCHAR(120) NOT NULL,
    "fact_type" VARCHAR(40) NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "verification" VARCHAR(24) NOT NULL DEFAULT 'unverified',
    "freshness" VARCHAR(16) NOT NULL DEFAULT 'unknown',
    "alternatives" JSONB NOT NULL DEFAULT '[]',
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intel_facts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intel_facts_entity_fact_key" ON "intel_facts"("entity_kind" ASC, "entity_id" ASC, "fact_type" ASC);

-- CreateIndex
CREATE INDEX "intel_facts_verification_idx" ON "intel_facts"("verification" ASC, "last_seen_at" DESC);

-- CreateTable
CREATE TABLE "intel_evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fact_id" UUID NOT NULL,
    "source_slug" VARCHAR(120) NOT NULL,
    "source_kind" VARCHAR(40) NOT NULL DEFAULT 'unknown',
    "value" TEXT NOT NULL DEFAULT '',
    "url" TEXT,
    "retrieved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "snippet" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intel_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intel_evidence_fact_idx" ON "intel_evidence"("fact_id" ASC, "retrieved_at" DESC);

-- AddForeignKey
ALTER TABLE "intel_evidence" ADD CONSTRAINT "intel_evidence_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "intel_facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "intel_changes" (
    "id" BIGSERIAL NOT NULL,
    "entity_kind" VARCHAR(40) NOT NULL,
    "entity_id" VARCHAR(120) NOT NULL,
    "fact_type" VARCHAR(40) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "source_slug" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intel_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intel_changes_entity_created_idx" ON "intel_changes"("entity_kind" ASC, "entity_id" ASC, "created_at" DESC);

-- CreateTable
CREATE TABLE "intel_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reason" VARCHAR(40) NOT NULL,
    "entity_kind" VARCHAR(40),
    "entity_id" VARCHAR(120),
    "details" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(16) NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "intel_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intel_reviews_status_created_idx" ON "intel_reviews"("status" ASC, "created_at" DESC);
