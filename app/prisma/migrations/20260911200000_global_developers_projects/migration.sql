-- Global Developer + Project tables for canonical place graph

-- Global Developer registry (replaces static arrays over time)
CREATE TABLE IF NOT EXISTS "global_developers" (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,

  name_ka TEXT,
  name_en TEXT NOT NULL,
  name_ru TEXT,

  years_active INT DEFAULT 0,
  projects_done INT DEFAULT 0,
  units_delivered INT DEFAULT 0,

  description_ka TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_de TEXT,

  verified BOOLEAN DEFAULT FALSE,
  phone TEXT,
  logo_url TEXT,
  website TEXT,

  social_instagram TEXT,
  social_facebook TEXT,

  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX idx_global_developers_country_city ON "global_developers"(country_code, city);
CREATE INDEX idx_global_developers_verified ON "global_developers"(verified);
CREATE INDEX idx_global_developers_created_at ON "global_developers"(created_at DESC);

-- Global Project registry (replaces static arrays over time)
CREATE TABLE IF NOT EXISTS "global_projects" (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  developer_id TEXT REFERENCES "global_developers"(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,

  name_ka TEXT,
  name_en TEXT NOT NULL,
  name_ru TEXT,

  description_ka TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_de TEXT,

  location GEOGRAPHY(Point, 4326) NOT NULL,
  address_ka TEXT,
  address_en TEXT,

  completion_percent INT DEFAULT 0,
  completion_quarter TEXT,
  completion_year INT,

  total_units INT DEFAULT 0,
  available_units INT DEFAULT 0,

  price_per_sqm_usd_from INT,
  price_per_sqm_usd_to INT,

  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  features_ka TEXT,
  features_en TEXT,

  hero_image_url TEXT,
  images_urls TEXT[] DEFAULT ARRAY[]::TEXT[],

  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,

  source TEXT,
  source_url TEXT,

  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX idx_global_projects_developer_id ON "global_projects"(developer_id);
CREATE INDEX idx_global_projects_country_city ON "global_projects"(country_code, city);
CREATE INDEX idx_global_projects_location ON "global_projects" USING GIST(location);
CREATE INDEX idx_global_projects_completion ON "global_projects"(completion_percent DESC);
CREATE INDEX idx_global_projects_created_at ON "global_projects"(created_at DESC);

-- Metro-level metadata (for coverage, POI count, building count)
CREATE TABLE IF NOT EXISTS "metro_metadata" (
  id TEXT PRIMARY KEY NOT NULL,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,
  metro_name_en TEXT NOT NULL,
  metro_name_local TEXT,

  center GEOGRAPHY(Point, 4326) NOT NULL,
  bbox GEOMETRY(Polygon, 4326),

  population INT,
  language_iso_639 TEXT DEFAULT 'en',

  poi_count INT DEFAULT 0,
  building_count INT DEFAULT 0,
  street_count INT DEFAULT 0,
  project_count INT DEFAULT 0,
  developer_count INT DEFAULT 0,

  data_completeness_percent INT DEFAULT 0,
  last_osm_sync TIMESTAMPTZ(6),

  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),

  UNIQUE(country_code, city)
);

CREATE INDEX idx_metro_metadata_center ON "metro_metadata" USING GIST(center::GEOMETRY);
CREATE INDEX idx_metro_metadata_bbox ON "metro_metadata" USING GIST(bbox);
CREATE INDEX idx_metro_metadata_completeness ON "metro_metadata"(data_completeness_percent DESC);
