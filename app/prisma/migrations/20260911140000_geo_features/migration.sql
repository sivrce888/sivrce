-- Canonical Berlin/DE spatial features for MVT tiles + provenance.
-- Geometry lives in PostGIS; Prisma mirrors non-geom columns.
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS "geo_features" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" VARCHAR(40) NOT NULL,
    "city" VARCHAR(40) NOT NULL DEFAULT 'berlin',
    "country" VARCHAR(4) NOT NULL DEFAULT 'DE',
    "source_slug" VARCHAR(120) NOT NULL,
    "external_id" VARCHAR(240) NOT NULL,
    "name" VARCHAR(240),
    "props" JSONB NOT NULL DEFAULT '{}',
    "geom" geometry(Geometry, 4326) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "license" VARCHAR(80) NOT NULL DEFAULT 'dl-de-zero-2.0',
    "source_url" TEXT,
    "retrieved_at" TIMESTAMPTZ(6) NOT NULL,
    "valid_from" TIMESTAMPTZ(6),
    "valid_to" TIMESTAMPTZ(6),
    "confidence" SMALLINT NOT NULL DEFAULT 100,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "geo_features_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "geo_features_source_external_key" UNIQUE ("source_slug", "external_id"),
    CONSTRAINT "geo_features_confidence_chk" CHECK ("confidence" >= 0 AND "confidence" <= 100)
);

CREATE INDEX IF NOT EXISTS "geo_features_geom_gix" ON "geo_features" USING GIST ("geom");
CREATE INDEX IF NOT EXISTS "geo_features_kind_city_idx" ON "geo_features" ("kind", "city");
CREATE INDEX IF NOT EXISTS "geo_features_bbox_idx" ON "geo_features" USING GIST (ST_Envelope("geom"));

-- Reject empty / invalid geometries at write time.
CREATE OR REPLACE FUNCTION geo_features_validate() RETURNS trigger AS $$
BEGIN
  IF NEW.geom IS NULL OR ST_IsEmpty(NEW.geom) THEN
    RAISE EXCEPTION 'geo_features.geom empty';
  END IF;
  IF NOT ST_IsValid(NEW.geom) THEN
    NEW.geom := ST_MakeValid(NEW.geom);
  END IF;
  IF ST_SRID(NEW.geom) <> 4326 THEN
    NEW.geom := ST_SetSRID(NEW.geom, 4326);
  END IF;
  NEW.lat := ST_Y(ST_PointOnSurface(NEW.geom));
  NEW.lng := ST_X(ST_PointOnSurface(NEW.geom));
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS geo_features_validate_trg ON "geo_features";
CREATE TRIGGER geo_features_validate_trg
  BEFORE INSERT OR UPDATE OF geom ON "geo_features"
  FOR EACH ROW EXECUTE FUNCTION geo_features_validate();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sivrce_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.geo_features TO sivrce_app;
  END IF;
END $$;
