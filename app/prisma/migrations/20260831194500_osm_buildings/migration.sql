-- OSM building corpus for national map / site lookup (Phase B).
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS "osm_buildings" (
    "osm_id" BIGINT NOT NULL,
    "osm_type" VARCHAR(10) NOT NULL DEFAULT 'way',
    "city" VARCHAR(40) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "levels" INTEGER,
    "height_m" DOUBLE PRECISION,
    "name" VARCHAR(240),
    "building" VARCHAR(40),
    "ring" JSONB NOT NULL,
    "location" geography(Point, 4326),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "osm_buildings_pkey" PRIMARY KEY ("osm_id")
);

CREATE INDEX IF NOT EXISTS "osm_buildings_city_idx" ON "osm_buildings"("city");
CREATE INDEX IF NOT EXISTS "osm_buildings_location_gix" ON "osm_buildings" USING GIST ("location");

CREATE OR REPLACE FUNCTION osm_buildings_sync_location() RETURNS trigger AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL
     AND NEW.lat BETWEEN -90 AND 90 AND NEW.lng BETWEEN -180 AND 180 THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS osm_buildings_location_trg ON "osm_buildings";
CREATE TRIGGER osm_buildings_location_trg
  BEFORE INSERT OR UPDATE OF lat, lng ON "osm_buildings"
  FOR EACH ROW EXECUTE FUNCTION osm_buildings_sync_location();

-- Backfill if rows exist without location.
UPDATE "osm_buildings"
SET "location" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography
WHERE "location" IS NULL
  AND "lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180;

-- App role (pooler user) needs DML; MCP creates as postgres.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.osm_buildings TO sivrce_app;
