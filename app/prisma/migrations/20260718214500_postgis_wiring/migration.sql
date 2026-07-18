-- PostGIS wiring: extension, backfill listings.location, GIST indexes, sync triggers.
-- Supabase + local must have postgis available (CI uses .github/docker/postgres-ci).

CREATE EXTENSION IF NOT EXISTS postgis;

-- Backfill geography from float lat/lng (lng first for ST_MakePoint).
UPDATE "listings"
SET "location" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography
WHERE "location" IS NULL
  AND "lat" IS NOT NULL
  AND "lng" IS NOT NULL
  AND "lat" BETWEEN -90 AND 90
  AND "lng" BETWEEN -180 AND 180;

CREATE INDEX IF NOT EXISTS "listings_location_gix" ON "listings" USING GIST ("location");
CREATE INDEX IF NOT EXISTS "pois_location_gix" ON "pois" USING GIST ("location");
CREATE INDEX IF NOT EXISTS "map_ai_zones_polygon_gix" ON "map_ai_zones" USING GIST ("polygon");

CREATE OR REPLACE FUNCTION listings_sync_location() RETURNS trigger AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL
     AND NEW.lat BETWEEN -90 AND 90
     AND NEW.lng BETWEEN -180 AND 180 THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listings_sync_location ON "listings";
CREATE TRIGGER trg_listings_sync_location
  BEFORE INSERT OR UPDATE OF "lat", "lng" ON "listings"
  FOR EACH ROW EXECUTE FUNCTION listings_sync_location();
