-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DataSourceKind" AS ENUM ('government', 'official_company', 'official_registry', 'public_listing', 'media', 'news', 'open_data', 'api', 'geospatial', 'user_generated', 'unknown');

-- CreateEnum
CREATE TYPE "SourceReliability" AS ENUM ('official_government', 'official_company', 'official_registry', 'established_institution', 'reputable_media', 'verified_company', 'public_listing', 'user_generated', 'unknown');

-- CreateEnum
CREATE TYPE "FactConfidence" AS ENUM ('verified', 'high_confidence', 'likely', 'unverified', 'outdated', 'conflicting');

-- CreateEnum
CREATE TYPE "FreshnessState" AS ENUM ('live', 'recent', 'aging', 'stale', 'unknown');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('developer', 'company', 'agency', 'agent', 'project', 'building', 'unit', 'listing', 'address', 'district', 'neighborhood', 'city', 'country');

-- CreateEnum
CREATE TYPE "ProjectLifecycleStatus" AS ENUM ('announced', 'pre_launch', 'planned', 'permitted', 'under_construction', 'near_completion', 'completed', 'suspended', 'cancelled', 'unknown');

-- CreateEnum
CREATE TYPE "DataChangeKind" AS ENUM ('created', 'updated', 'status_changed', 'price_changed', 'merged', 'split', 'deprecated');

-- CreateEnum
CREATE TYPE "ReviewQueueKind" AS ENUM ('needs_review', 'duplicate_candidate', 'conflict', 'low_confidence', 'failed_source', 'stale_data', 'new_entity');

-- CreateTable
CREATE TABLE "data_sources" (
    "id" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "kind" "DataSourceKind" NOT NULL,
    "reliability" "SourceReliability" NOT NULL,
    "country" VARCHAR(40) NOT NULL,
    "url" VARCHAR(500),
    "api_endpoint" VARCHAR(500),
    "robots_txt_ok" BOOLEAN NOT NULL DEFAULT true,
    "terms_url" VARCHAR(500),
    "rate_limit_ms" INTEGER,
    "refresh_hours" INTEGER,
    "reliability_note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_fetched_at" TIMESTAMPTZ(6),
    "last_success_at" TIMESTAMPTZ(6),
    "last_error_at" TIMESTAMPTZ(6),
    "last_error" VARCHAR(500),
    "fetch_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "record_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_source_records" (
    "id" VARCHAR(120) NOT NULL,
    "source_id" VARCHAR(120) NOT NULL,
    "external_id" VARCHAR(240),
    "url" VARCHAR(500),
    "fetched_at" TIMESTAMPTZ(6) NOT NULL,
    "http_status" INTEGER,
    "content_hash" VARCHAR(64),
    "record_size" INTEGER,
    "parsed_ok" BOOLEAN NOT NULL DEFAULT true,
    "error" VARCHAR(500),
    "raw_ref" VARCHAR(500),

    CONSTRAINT "data_source_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_provenance" (
    "id" VARCHAR(120) NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" VARCHAR(120) NOT NULL,
    "fact_key" VARCHAR(120) NOT NULL,
    "fact_value" TEXT NOT NULL,
    "source_id" VARCHAR(120) NOT NULL,
    "source_url" VARCHAR(500),
    "fetched_at" TIMESTAMPTZ(6) NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "confidence" "FactConfidence" NOT NULL DEFAULT 'unverified',
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_provenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_relationships" (
    "id" VARCHAR(120) NOT NULL,
    "from_type" "EntityType" NOT NULL,
    "from_id" VARCHAR(120) NOT NULL,
    "to_type" "EntityType" NOT NULL,
    "to_id" VARCHAR(120) NOT NULL,
    "relation" VARCHAR(60) NOT NULL,
    "confidence" "FactConfidence" NOT NULL DEFAULT 'likely',
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_snapshots" (
    "id" VARCHAR(120) NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" VARCHAR(120) NOT NULL,
    "data" JSONB NOT NULL,
    "source_id" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_changes" (
    "id" VARCHAR(120) NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" VARCHAR(120) NOT NULL,
    "change_kind" "DataChangeKind" NOT NULL,
    "field" VARCHAR(120),
    "old_value" TEXT,
    "new_value" TEXT,
    "source_id" VARCHAR(120),
    "snapshot_id" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_aliases" (
    "id" VARCHAR(120) NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" VARCHAR(120) NOT NULL,
    "alias" VARCHAR(240) NOT NULL,
    "language" VARCHAR(10) NOT NULL DEFAULT 'ka',
    "is_canonical" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_queue" (
    "id" VARCHAR(120) NOT NULL,
    "kind" "ReviewQueueKind" NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" VARCHAR(120) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "details" JSONB,
    "assigned_to" VARCHAR(120),
    "resolved_at" TIMESTAMPTZ(6),
    "resolution" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_quality_scores" (
    "id" VARCHAR(120) NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" VARCHAR(120) NOT NULL,
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "accuracy" INTEGER NOT NULL DEFAULT 0,
    "freshness" INTEGER NOT NULL DEFAULT 0,
    "source_quality" INTEGER NOT NULL DEFAULT 0,
    "cross_source" INTEGER NOT NULL DEFAULT 0,
    "overall" INTEGER NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_quality_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_coverage_metrics" (
    "id" VARCHAR(120) NOT NULL,
    "country" VARCHAR(40) NOT NULL,
    "developer_coverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "project_coverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active_project_coverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "geographic_coverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source_coverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freshness_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verified_ratio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overall_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_coverage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_slug_key" ON "data_sources"("slug");

-- CreateIndex
CREATE INDEX "data_sources_country_active_idx" ON "data_sources"("country", "is_active");

-- CreateIndex
CREATE INDEX "data_sources_kind_active_idx" ON "data_sources"("kind", "is_active");

-- CreateIndex
CREATE INDEX "data_source_records_source_fetched_idx" ON "data_source_records"("source_id", "fetched_at" DESC);

-- CreateIndex
CREATE INDEX "data_source_records_external_id_idx" ON "data_source_records"("external_id");

-- CreateIndex
CREATE INDEX "data_provenance_entity_fact_idx" ON "data_provenance"("entity_type", "entity_id", "fact_key");

-- CreateIndex
CREATE INDEX "data_provenance_entity_current_idx" ON "data_provenance"("entity_type", "entity_id", "is_current");

-- CreateIndex
CREATE INDEX "data_provenance_source_fetched_idx" ON "data_provenance"("source_id", "fetched_at" DESC);

-- CreateIndex
CREATE INDEX "entity_relationships_from_idx" ON "entity_relationships"("from_type", "from_id");

-- CreateIndex
CREATE INDEX "entity_relationships_to_idx" ON "entity_relationships"("to_type", "to_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_relationships_unique" ON "entity_relationships"("from_type", "from_id", "to_type", "to_id", "relation");

-- CreateIndex
CREATE INDEX "data_snapshots_entity_created_idx" ON "data_snapshots"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "data_changes_entity_created_idx" ON "data_changes"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "data_changes_kind_created_idx" ON "data_changes"("change_kind", "created_at" DESC);

-- CreateIndex
CREATE INDEX "entity_aliases_type_alias_idx" ON "entity_aliases"("entity_type", "alias");

-- CreateIndex
CREATE INDEX "entity_aliases_type_entity_idx" ON "entity_aliases"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_aliases_unique" ON "entity_aliases"("entity_type", "entity_id", "alias", "language");

-- CreateIndex
CREATE INDEX "review_queue_kind_resolved_idx" ON "review_queue"("kind", "resolved_at");

-- CreateIndex
CREATE INDEX "review_queue_entity_idx" ON "review_queue"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "data_quality_scores_overall_idx" ON "data_quality_scores"("overall");

-- CreateIndex
CREATE UNIQUE INDEX "data_quality_scores_entity_unique" ON "data_quality_scores"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "data_coverage_country_calc_idx" ON "data_coverage_metrics"("country", "calculated_at" DESC);

-- AddForeignKey
ALTER TABLE "data_source_records" ADD CONSTRAINT "data_source_records_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_provenance" ADD CONSTRAINT "data_provenance_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

