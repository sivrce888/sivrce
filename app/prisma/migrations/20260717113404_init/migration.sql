-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('buyer', 'seller', 'agent', 'agency', 'developer', 'admin');

-- CreateEnum
CREATE TYPE "listing_deal_type" AS ENUM ('buy', 'rent', 'daily', 'mortgage');

-- CreateEnum
CREATE TYPE "listing_property_type" AS ENUM ('apartment', 'house', 'villa', 'commercial', 'land', 'hotel', 'party_house');

-- CreateEnum
CREATE TYPE "listing_tier" AS ENUM ('standard', 'vip', 'super-vip', 'diamond');

-- CreateEnum
CREATE TYPE "listing_currency" AS ENUM ('USD', 'GEL');

-- CreateEnum
CREATE TYPE "listing_status" AS ENUM ('active', 'sold', 'pending', 'expired', 'withdrawn');

-- CreateEnum
CREATE TYPE "media_kind" AS ENUM ('photo', 'video', 'panorama', 'floor_plan');

-- CreateEnum
CREATE TYPE "media_processing_status" AS ENUM ('queued', 'processing', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "poi_kind" AS ENUM ('metro', 'bus_stop', 'minibus_stop', 'cable_car', 'funicular', 'school', 'kindergarten', 'pharmacy', 'supermarket', 'park', 'hospital', 'cafe', 'other');

-- CreateEnum
CREATE TYPE "listing_price_event_type" AS ENUM ('listed', 'price_drop', 'price_increase', 'sold');

-- CreateEnum
CREATE TYPE "auction_status" AS ENUM ('scheduled', 'live', 'paused', 'ended_sold', 'ended_unsold', 'cancelled');

-- CreateEnum
CREATE TYPE "bid_status" AS ENUM ('leading', 'outbid', 'cancelled', 'won');

-- CreateEnum
CREATE TYPE "auction_deposit_status" AS ENUM ('pending', 'held', 'refunded', 'forfeit', 'applied');

-- CreateEnum
CREATE TYPE "complaint_kind" AS ENUM ('spam', 'fraud', 'harassment', 'misinformation', 'duplicate_listing', 'impersonation', 'scam_payment', 'illegal_content', 'other');

-- CreateEnum
CREATE TYPE "complaint_status" AS ENUM ('open', 'under_review', 'resolved', 'dismissed', 'duplicate');

-- CreateEnum
CREATE TYPE "complaint_priority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "moderation_decision" AS ENUM ('approve', 'reject', 'hide', 'delete', 'warn_user', 'suspend_user', 'escalate', 'no_action');

-- CreateEnum
CREATE TYPE "moderation_queue_status" AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'auto_resolved');

-- CreateEnum
CREATE TYPE "shadow_ban_scope" AS ENUM ('all', 'listings', 'messages', 'reviews');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('pending', 'confirmed', 'cancelled_by_guest', 'cancelled_by_host', 'no_show', 'completed');

-- CreateEnum
CREATE TYPE "crm_lead_status" AS ENUM ('new', 'contacted', 'viewing_scheduled', 'offer_made', 'negotiating', 'closed_won', 'closed_lost', 'disqualified');

-- CreateEnum
CREATE TYPE "crm_task_priority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "crm_task_status" AS ENUM ('todo', 'in_progress', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "subscription_tier" AS ENUM ('agent_pro', 'super_agent', 'agency');

-- CreateEnum
CREATE TYPE "subscription_interval" AS ENUM ('month', 'year');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired');

-- CreateEnum
CREATE TYPE "building_3d_status" AS ENUM ('active', 'under_construction', 'planned', 'demolished', 'renovation');

-- CreateEnum
CREATE TYPE "building_material" AS ENUM ('concrete', 'brick', 'glass_steel', 'wood', 'mixed', 'panel', 'stone', 'other');

-- CreateEnum
CREATE TYPE "blog_post_status" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "chat_message_kind" AS ENUM ('text', 'image', 'file', 'system');

-- CreateEnum
CREATE TYPE "tour_status" AS ENUM ('pending', 'confirmed', 'cancelled_by_guest', 'cancelled_by_agent', 'completed', 'no_show');

-- CreateEnum
CREATE TYPE "behavior_kind" AS ENUM ('view', 'save', 'inquiry', 'search', 'tour_booking', 'share');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160),
    "email" VARCHAR(240) NOT NULL,
    "email_verified" TIMESTAMPTZ(6),
    "phone" VARCHAR(30),
    "phone_verified_at" TIMESTAMPTZ(6),
    "image" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'buyer',
    "trust_score" INTEGER NOT NULL DEFAULT 70,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "user_id" VARCHAR(120) NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "provider" VARCHAR(60) NOT NULL,
    "provider_account_id" VARCHAR(240) NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" VARCHAR(40),
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("provider","provider_account_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "session_token" VARCHAR(240) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_token")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "authenticators" (
    "credential_id" TEXT NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "credential_public_key" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credential_device_type" TEXT NOT NULL,
    "credential_backed_up" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "authenticators_pkey" PRIMARY KEY ("user_id","credential_id")
);

-- CreateTable
CREATE TABLE "pois" (
    "id" UUID NOT NULL,
    "kind" "poi_kind" NOT NULL,
    "name_ka" VARCHAR(240) NOT NULL,
    "name_en" VARCHAR(240),
    "name_ru" VARCHAR(240),
    "location" geography(Point, 4326) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_nearest_poi" (
    "id" BIGSERIAL NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "poi_id" UUID NOT NULL,
    "poi_kind" "poi_kind" NOT NULL,
    "distance_m" INTEGER NOT NULL,
    "walk_time_min" INTEGER,
    "drive_time_min" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_nearest_poi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_ai_zones" (
    "id" VARCHAR(120) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "district" VARCHAR(120) NOT NULL,
    "city" VARCHAR(120) NOT NULL DEFAULT 'Tbilisi',
    "polygon" geometry(Polygon, 4326) NOT NULL,
    "investment_score" INTEGER NOT NULL DEFAULT 0,
    "rental_demand_score" INTEGER NOT NULL DEFAULT 0,
    "appreciation_forecast" INTEGER NOT NULL DEFAULT 0,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "livability_score" INTEGER NOT NULL DEFAULT 0,
    "listing_count" INTEGER NOT NULL DEFAULT 0,
    "avg_price_per_sqm" INTEGER NOT NULL DEFAULT 0,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "reason_codes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "map_ai_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_media" (
    "id" UUID NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "kind" "media_kind" NOT NULL DEFAULT 'photo',
    "storage_bucket" VARCHAR(80) NOT NULL DEFAULT 'listing-media',
    "storage_path" TEXT NOT NULL,
    "cdn_url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "size_bytes" BIGINT,
    "mime_type" VARCHAR(180),
    "file_sha256" VARCHAR(64),
    "position" SMALLINT NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "caption_ka" TEXT,
    "caption_en" TEXT,
    "caption_ru" TEXT,
    "ai_room_tag" VARCHAR(64),
    "ai_features_detected" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "processing_status" "media_processing_status" NOT NULL DEFAULT 'ready',
    "processing_error" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "uploaded_by" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_price_events" (
    "id" BIGSERIAL NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "eventType" "listing_price_event_type" NOT NULL DEFAULT 'listed',
    "price" INTEGER NOT NULL,
    "previous_price" INTEGER,
    "currency" "listing_currency" NOT NULL,
    "price_per_sqm" INTEGER,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_price_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(120),
    "period_month" VARCHAR(7) NOT NULL,
    "avg_price_per_sqm" INTEGER NOT NULL,
    "medianPrice" INTEGER,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "avg_days_on_market" INTEGER NOT NULL DEFAULT 0,
    "new_listings_count" INTEGER NOT NULL DEFAULT 0,
    "active_listings_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" VARCHAR(120) NOT NULL,
    "owner_id" VARCHAR(120),
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "deal_type" "listing_deal_type" NOT NULL,
    "type" "listing_property_type" NOT NULL,
    "tier" "listing_tier" NOT NULL DEFAULT 'standard',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER NOT NULL,
    "currency" "listing_currency" NOT NULL DEFAULT 'GEL',
    "price_per_sqm" INTEGER,
    "rooms" INTEGER NOT NULL DEFAULT 0,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "area" DOUBLE PRECISION NOT NULL,
    "floor" INTEGER,
    "total_floors" INTEGER,
    "year_built" INTEGER,
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(120) NOT NULL,
    "address" VARCHAR(240) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326),
    "search_vector" tsvector,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extended_fields" JSONB,
    "agent" JSONB NOT NULL,
    "listing_phone" VARCHAR(30),
    "listing_phone_verified_at" TIMESTAMPTZ(6),
    "views" INTEGER NOT NULL DEFAULT 0,
    "trust_score" INTEGER NOT NULL DEFAULT 70,
    "fill_percentage" SMALLINT NOT NULL DEFAULT 0,
    "tier_expires_at" TIMESTAMPTZ(6),
    "tier_purchased_at" TIMESTAMPTZ(6),
    "tier_payment_order_id" VARCHAR(36),
    "status" "listing_status" NOT NULL DEFAULT 'active',
    "sold_at" TIMESTAMPTZ(6),
    "sold_price" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_boost_history" (
    "id" UUID NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120),
    "from_tier" VARCHAR(30) NOT NULL DEFAULT 'standard',
    "to_tier" VARCHAR(30) NOT NULL,
    "amount_tetri" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'GEL',
    "provider" VARCHAR(20),
    "provider_order_id" VARCHAR(240),
    "duration_days" INTEGER NOT NULL DEFAULT 30,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "ended_reason" VARCHAR(40),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_boost_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_rental_settings" (
    "id" UUID NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "min_nights" INTEGER NOT NULL DEFAULT 1,
    "max_nights" INTEGER NOT NULL DEFAULT 30,
    "instant_book" BOOLEAN NOT NULL DEFAULT false,
    "check_in_hour" INTEGER NOT NULL DEFAULT 15,
    "check_out_hour" INTEGER NOT NULL DEFAULT 11,
    "cleaning_fee_tetri" INTEGER NOT NULL DEFAULT 0,
    "security_deposit_tetri" INTEGER NOT NULL DEFAULT 0,
    "weekend_price_tetri" INTEGER,
    "weekly_discount_pct" INTEGER NOT NULL DEFAULT 0,
    "monthly_discount_pct" INTEGER NOT NULL DEFAULT 0,
    "guest_capacity" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_rental_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_rental_bookings" (
    "id" UUID NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "guest_id" VARCHAR(120) NOT NULL,
    "check_in" TIMESTAMPTZ(6) NOT NULL,
    "check_out" TIMESTAMPTZ(6) NOT NULL,
    "nights" INTEGER NOT NULL,
    "guest_count" INTEGER NOT NULL,
    "nightly_price_tetri" INTEGER NOT NULL,
    "cleaning_fee_tetri" INTEGER NOT NULL,
    "security_deposit_tetri" INTEGER NOT NULL,
    "discount_tetri" INTEGER NOT NULL DEFAULT 0,
    "total_tetri" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'GEL',
    "status" "booking_status" NOT NULL DEFAULT 'pending',
    "guest_name" VARCHAR(160) NOT NULL,
    "guest_phone" VARCHAR(30) NOT NULL,
    "guest_email" VARCHAR(240),
    "guest_notes" TEXT,
    "host_notes" TEXT,
    "payment_order_id" VARCHAR(36),
    "paid_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_rental_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_rental_blocked_dates" (
    "id" UUID NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "date" DATE NOT NULL,
    "reason" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_rental_blocked_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" UUID NOT NULL,
    "agent_id" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(240),
    "source" VARCHAR(40) NOT NULL DEFAULT 'inquiry',
    "status" "crm_lead_status" NOT NULL DEFAULT 'new',
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'GEL',
    "deal_type" VARCHAR(20),
    "district" VARCHAR(120),
    "notes" TEXT,
    "last_contact" TIMESTAMPTZ(6),
    "next_follow_up" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "closed_reason" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "agent_id" VARCHAR(120) NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_tasks" (
    "id" UUID NOT NULL,
    "agent_id" VARCHAR(120) NOT NULL,
    "lead_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMPTZ(6) NOT NULL,
    "priority" "crm_task_priority" NOT NULL DEFAULT 'medium',
    "status" "crm_task_status" NOT NULL DEFAULT 'todo',
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_providers" (
    "id" UUID NOT NULL,
    "owner_id" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "subcategory" VARCHAR(60),
    "description" TEXT NOT NULL,
    "logo_url" TEXT,
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(240),
    "website" VARCHAR(240),
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(120),
    "address" VARCHAR(240),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "price_range_min" INTEGER,
    "price_range_max" INTEGER,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'GEL',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "portfolio_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hours" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_provider_reviews" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "author_id" VARCHAR(120) NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_provider_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_listings" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "saved_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_profiles" (
    "id" VARCHAR(120) NOT NULL,
    "owner_id" VARCHAR(120),
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "logo_text" VARCHAR(40) NOT NULL,
    "projects_count" INTEGER NOT NULL DEFAULT 0,
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "headquarters" VARCHAR(160) NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" VARCHAR(80) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "developer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" VARCHAR(120) NOT NULL,
    "owner_id" VARCHAR(120),
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "agency" VARCHAR(160) NOT NULL,
    "listings_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "avatar_text" VARCHAR(24) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "color" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_directories" (
    "id" VARCHAR(120) NOT NULL,
    "owner_id" VARCHAR(120),
    "slug" VARCHAR(140) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "developer" VARCHAR(180) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(120) NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "ready_by" VARCHAR(80) NOT NULL,
    "price_from" INTEGER NOT NULL DEFAULT 0,
    "price_per_sqm_from" INTEGER NOT NULL DEFAULT 0,
    "units" INTEGER NOT NULL DEFAULT 1,
    "image" VARCHAR(260) NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "project_directories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_profiles" (
    "id" VARCHAR(120) NOT NULL,
    "owner_id" VARCHAR(120),
    "slug" VARCHAR(140) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "logo_text" VARCHAR(40) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "team_size" INTEGER NOT NULL DEFAULT 1,
    "active_listings" INTEGER NOT NULL DEFAULT 0,
    "monthly_leads" INTEGER NOT NULL DEFAULT 0,
    "response_rate_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_deal_days" INTEGER NOT NULL DEFAULT 0,
    "city" VARCHAR(100) NOT NULL,
    "districts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "color" VARCHAR(80) NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "agency_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auctions" (
    "id" VARCHAR(120) NOT NULL,
    "short_public_code" VARCHAR(10) NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "organizer_id" VARCHAR(120) NOT NULL,
    "agency_id" VARCHAR(120),
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(40),
    "external_id" VARCHAR(120),
    "starting_price_tetri" INTEGER NOT NULL,
    "current_price_tetri" INTEGER NOT NULL,
    "reserve_price_tetri" INTEGER,
    "buy_now_price_tetri" INTEGER,
    "bid_increment_tetri" INTEGER NOT NULL DEFAULT 100,
    "deposit_amount_tetri" INTEGER NOT NULL,
    "currency" "listing_currency" NOT NULL DEFAULT 'GEL',
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "anti_snipe_minutes" INTEGER NOT NULL DEFAULT 5,
    "status" "auction_status" NOT NULL DEFAULT 'scheduled',
    "paused_at" TIMESTAMPTZ(6),
    "paused_reason" TEXT,
    "total_bids" INTEGER NOT NULL DEFAULT 0,
    "unique_bidders" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "winning_bid_id" VARCHAR(120),
    "winner_user_id" VARCHAR(120),
    "winning_amount_tetri" INTEGER,
    "winner_paid_at" TIMESTAMPTZ(6),
    "terms_url" TEXT,
    "description_ka" TEXT,
    "description_en" TEXT,
    "description_ru" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_deposits" (
    "id" UUID NOT NULL,
    "auction_id" VARCHAR(120) NOT NULL,
    "bidder_id" VARCHAR(120) NOT NULL,
    "amount_tetri" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'GEL',
    "payment_order_id" UUID NOT NULL,
    "status" "auction_deposit_status" NOT NULL DEFAULT 'pending',
    "held_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refunded_at" TIMESTAMPTZ(6),
    "forfeit_at" TIMESTAMPTZ(6),
    "forfeit_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auction_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" VARCHAR(120) NOT NULL,
    "auction_id" VARCHAR(120) NOT NULL,
    "bidder_id" VARCHAR(120) NOT NULL,
    "deposit_id" UUID NOT NULL,
    "amount_tetri" INTEGER NOT NULL,
    "max_amount_tetri" INTEGER,
    "is_proxy" BOOLEAN NOT NULL DEFAULT false,
    "is_buy_now" BOOLEAN NOT NULL DEFAULT false,
    "status" "bid_status" NOT NULL DEFAULT 'leading',
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "placed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_watchers" (
    "user_id" VARCHAR(120) NOT NULL,
    "auction_id" VARCHAR(120) NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notify_5min_before" BOOLEAN NOT NULL DEFAULT true,
    "notify_outbid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "auction_watchers_pkey" PRIMARY KEY ("user_id","auction_id")
);

-- CreateTable
CREATE TABLE "forum_threads" (
    "id" VARCHAR(120) NOT NULL,
    "owner_id" VARCHAR(120),
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "district" VARCHAR(80) NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "replies" INTEGER NOT NULL DEFAULT 0,
    "verified_responses" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_replies" (
    "id" VARCHAR(120) NOT NULL,
    "thread_id" VARCHAR(120) NOT NULL,
    "owner_id" VARCHAR(120),
    "author_name" VARCHAR(80) NOT NULL,
    "body" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "forum_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" VARCHAR(120) NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "agent_name" VARCHAR(160) NOT NULL,
    "agent_email" VARCHAR(240),
    "agent_phone" VARCHAR(40),
    "buyer_name" VARCHAR(160) NOT NULL,
    "buyer_email" VARCHAR(240) NOT NULL,
    "buyer_phone" VARCHAR(40),
    "message" TEXT NOT NULL,
    "deal" VARCHAR(20) NOT NULL DEFAULT 'buy',
    "city" VARCHAR(100) NOT NULL DEFAULT '',
    "district" VARCHAR(120) NOT NULL DEFAULT '',
    "status" VARCHAR(30) NOT NULL DEFAULT 'new',
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "is_for_sale" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER NOT NULL DEFAULT 0,
    "exclusivity_expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_purchases" (
    "id" VARCHAR(120) NOT NULL,
    "inquiry_id" VARCHAR(120) NOT NULL,
    "buyer_id" VARCHAR(120) NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'GEL',
    "purchased_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "lead_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "alert_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_alert_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_search_alert_logs" (
    "id" VARCHAR(120) NOT NULL,
    "saved_search_id" VARCHAR(120) NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_search_alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" VARCHAR(120) NOT NULL,
    "target_type" VARCHAR(30) NOT NULL,
    "target_id" VARCHAR(120) NOT NULL,
    "author_id" VARCHAR(120),
    "author_name" VARCHAR(160) NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_orders" (
    "id" VARCHAR(120) NOT NULL,
    "session_id" VARCHAR(240) NOT NULL,
    "user_id" VARCHAR(120),
    "listing_id" VARCHAR(120),
    "tier" "listing_tier" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'usd',
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_customers" (
    "id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "stripe_customer_id" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "stripe_customer_id" VARCHAR(120) NOT NULL,
    "stripe_subscription_id" VARCHAR(120) NOT NULL,
    "tier" "subscription_tier" NOT NULL,
    "interval" "subscription_interval" NOT NULL,
    "status" "subscription_status" NOT NULL,
    "current_period_start" TIMESTAMPTZ(6) NOT NULL,
    "current_period_end" TIMESTAMPTZ(6) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "trial_start" TIMESTAMPTZ(6),
    "trial_end" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "georgian_payment_orders" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "provider_order_id" VARCHAR(240) NOT NULL,
    "provider_payment_id" VARCHAR(240),
    "user_id" VARCHAR(120),
    "listing_id" VARCHAR(120),
    "tier" VARCHAR(30) NOT NULL,
    "amount_tetri" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'GEL',
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "last_event_id" VARCHAR(240),
    "last_event_payload" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "refunded_at" TIMESTAMPTZ(6),
    "disputed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "georgian_payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" UUID NOT NULL,
    "subject_type" VARCHAR(40) NOT NULL,
    "subject_id" VARCHAR(120) NOT NULL,
    "verification_type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "personal_id" VARCHAR(11),
    "business_number" VARCHAR(9),
    "document_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider_reference" VARCHAR(240),
    "reviewed_by" VARCHAR(120),
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_audit_logs" (
    "id" UUID NOT NULL,
    "verification_request_id" UUID NOT NULL,
    "actor_id" VARCHAR(120),
    "from_status" VARCHAR(30),
    "to_status" VARCHAR(30) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_audit" (
    "id" UUID NOT NULL,
    "actor_user_id" VARCHAR(120) NOT NULL,
    "recommendation_id" VARCHAR(80) NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "updated_listings" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "recommendation_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" VARCHAR(120) NOT NULL,
    "actor_name" VARCHAR(200) NOT NULL,
    "actor_role" VARCHAR(40) NOT NULL,
    "action" VARCHAR(160) NOT NULL,
    "target_type" VARCHAR(80) NOT NULL,
    "target_id" VARCHAR(200) NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ip_address" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "base_url" TEXT,
    "feed_url_template" TEXT,
    "feed_format" VARCHAR(16) NOT NULL,
    "imports_from" BOOLEAN NOT NULL DEFAULT false,
    "exports_to" BOOLEAN NOT NULL DEFAULT false,
    "auth_kind" VARCHAR(24),
    "auth_config" JSONB,
    "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_mappings" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "external_id" TEXT,
    "external_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "last_synced_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "sync_attempts" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "agency_profile_id" VARCHAR(120),
    "developer_profile_id" VARCHAR(120),
    "feed_url" TEXT,
    "feed_content_hash" VARCHAR(128),
    "records_received" INTEGER NOT NULL DEFAULT 0,
    "records_created" INTEGER NOT NULL DEFAULT 0,
    "records_updated" INTEGER NOT NULL DEFAULT 0,
    "records_skipped" INTEGER NOT NULL DEFAULT 0,
    "records_errored" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'queued',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "error_summary" TEXT,
    "log_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "format" VARCHAR(16) NOT NULL,
    "filter" JSONB,
    "records_count" INTEGER NOT NULL DEFAULT 0,
    "output_url" TEXT,
    "output_size_bytes" BIGINT,
    "output_sha256" VARCHAR(64),
    "status" VARCHAR(20) NOT NULL DEFAULT 'queued',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "error_summary" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_staging" (
    "id" UUID NOT NULL,
    "import_job_id" UUID NOT NULL,
    "external_id" VARCHAR(512) NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "matched_listing_id" VARCHAR(120),
    "match_confidence" DECIMAL(4,3),
    "match_method" VARCHAR(32),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_staging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_category_mappings" (
    "partner_id" UUID NOT NULL,
    "partner_value" VARCHAR(240) NOT NULL,
    "our_category" "listing_property_type" NOT NULL,
    "our_deal_type" "listing_deal_type" NOT NULL,

    CONSTRAINT "partner_category_mappings_pkey" PRIMARY KEY ("partner_id","partner_value")
);

-- CreateTable
CREATE TABLE "syndication_rules" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "applies_categories" "listing_property_type"[] DEFAULT ARRAY[]::"listing_property_type"[],
    "applies_deal_types" "listing_deal_type"[] DEFAULT ARRAY[]::"listing_deal_type"[],
    "applies_city_names" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "min_promotion_tier" "listing_tier",
    "exclude_owner_kinds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mask_phone" BOOLEAN NOT NULL DEFAULT true,
    "mask_address" BOOLEAN NOT NULL DEFAULT false,
    "hide_cadastre" BOOLEAN NOT NULL DEFAULT true,
    "agency_pays" BOOLEAN NOT NULL DEFAULT false,
    "cost_per_listing_tetri" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "syndication_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "short_id" VARCHAR(32) NOT NULL,
    "subject_kind" VARCHAR(24) NOT NULL,
    "subject_id" VARCHAR(120) NOT NULL,
    "subject_listing_id" VARCHAR(120),
    "subject_user_id" VARCHAR(120),
    "subject_review_id" VARCHAR(120),
    "subject_agency_profile_id" VARCHAR(120),
    "subject_developer_profile_id" VARCHAR(120),
    "subject_project_directory_id" VARCHAR(120),
    "subject_message_id" VARCHAR(120),
    "reporter_id" VARCHAR(120),
    "reporter_email" VARCHAR(240),
    "reporter_session_id" UUID,
    "reporter_ip" VARCHAR(64),
    "kind" "complaint_kind" NOT NULL,
    "description" TEXT,
    "evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "complaint_status" NOT NULL DEFAULT 'open',
    "priority" "complaint_priority" NOT NULL DEFAULT 'normal',
    "assigned_to" VARCHAR(120),
    "assigned_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" VARCHAR(120),
    "resolution" TEXT,
    "resolution_action" "moderation_decision",
    "duplicate_of" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_queue" (
    "id" UUID NOT NULL,
    "subject_kind" VARCHAR(24) NOT NULL,
    "subject_id" VARCHAR(120) NOT NULL,
    "subject_listing_id" VARCHAR(120),
    "subject_review_id" VARCHAR(120),
    "subject_user_id" VARCHAR(120),
    "subject_media_id" UUID,
    "reason" TEXT NOT NULL,
    "fraud_score" DECIMAL(4,2),
    "signals" JSONB,
    "priority" "complaint_priority" NOT NULL DEFAULT 'normal',
    "status" "moderation_queue_status" NOT NULL DEFAULT 'pending',
    "assigned_to" VARCHAR(120),
    "assigned_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" VARCHAR(120),
    "decision" "moderation_decision",
    "decision_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" UUID NOT NULL,
    "moderator_id" VARCHAR(120) NOT NULL,
    "subject_kind" VARCHAR(24) NOT NULL,
    "subject_id" VARCHAR(120) NOT NULL,
    "action" "moderation_decision" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "related_complaint_id" UUID,
    "related_moderation_queue_id" UUID,
    "subject_snapshot" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocklist_phones" (
    "phone" VARCHAR(32) NOT NULL,
    "reason" TEXT,
    "blocked_by" VARCHAR(120),
    "blocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "blocklist_phones_pkey" PRIMARY KEY ("phone")
);

-- CreateTable
CREATE TABLE "blocklist_emails" (
    "email_hash" VARCHAR(64) NOT NULL,
    "reason" TEXT,
    "blocked_by" VARCHAR(120),
    "blocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "blocklist_emails_pkey" PRIMARY KEY ("email_hash")
);

-- CreateTable
CREATE TABLE "blocklist_ips" (
    "ip_address" VARCHAR(64) NOT NULL,
    "reason" TEXT,
    "blocked_by" VARCHAR(120),
    "blocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "blocklist_ips_pkey" PRIMARY KEY ("ip_address")
);

-- CreateTable
CREATE TABLE "blocklist_devices" (
    "device_fingerprint" VARCHAR(128) NOT NULL,
    "reason" TEXT,
    "blocked_by" VARCHAR(120),
    "blocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "blocklist_devices_pkey" PRIMARY KEY ("device_fingerprint")
);

-- CreateTable
CREATE TABLE "fraud_signals" (
    "id" BIGSERIAL NOT NULL,
    "subject_kind" VARCHAR(24) NOT NULL,
    "subject_id" VARCHAR(120) NOT NULL,
    "signal_kind" VARCHAR(64) NOT NULL,
    "severity" SMALLINT NOT NULL DEFAULT 1,
    "confidence" DECIMAL(4,3),
    "details" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "detected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" VARCHAR(120),
    "resolution" TEXT,

    CONSTRAINT "fraud_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_clusters" (
    "id" UUID NOT NULL,
    "cluster_signature" VARCHAR(256) NOT NULL,
    "representative_listing_id" VARCHAR(120),
    "member_count" INTEGER NOT NULL DEFAULT 1,
    "detection_method" VARCHAR(32) NOT NULL,
    "confidence" DECIMAL(4,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duplicate_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_cluster_members" (
    "cluster_id" UUID NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "similarity_score" DECIMAL(4,3),
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duplicate_cluster_members_pkey" PRIMARY KEY ("cluster_id","listing_id")
);

-- CreateTable
CREATE TABLE "shadow_bans" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "banned_by" VARCHAR(120) NOT NULL,
    "reason" TEXT NOT NULL,
    "scope" "shadow_ban_scope" NOT NULL DEFAULT 'all',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "banned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lifted_at" TIMESTAMPTZ(6),
    "lifted_by" VARCHAR(120),

    CONSTRAINT "shadow_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_activity_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" VARCHAR(120),
    "session_id" UUID,
    "ip_address" VARCHAR(64),
    "device_fingerprint" VARCHAR(128),
    "activity_kind" VARCHAR(64) NOT NULL,
    "details" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suspicious_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_buildings" (
    "id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "polygon_coords" JSONB,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "project_slug" VARCHAR(140),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "map_buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_cms_snapshot" (
    "id" VARCHAR(32) NOT NULL,
    "pages_json" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_cms_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" VARCHAR(64) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" VARCHAR(120),

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings_3d" (
    "id" UUID NOT NULL,
    "map_building_id" UUID NOT NULL,
    "footprint_geojson" JSONB NOT NULL,
    "height_meters" DOUBLE PRECISION NOT NULL,
    "floor_count" INTEGER NOT NULL,
    "floor_height" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "underground_floors" INTEGER NOT NULL DEFAULT 0,
    "model_url_3d" TEXT,
    "model_format" VARCHAR(20),
    "material" "building_material" NOT NULL DEFAULT 'concrete',
    "year_built" INTEGER,
    "year_renovated" INTEGER,
    "architect" VARCHAR(200),
    "developer_id" VARCHAR(120),
    "status" "building_3d_status" NOT NULL DEFAULT 'active',
    "construction_progress" DOUBLE PRECISION,
    "ready_by" TIMESTAMPTZ(6),
    "parking_spaces" INTEGER,
    "elevator_count" INTEGER,
    "has_underground_parking" BOOLEAN NOT NULL DEFAULT false,
    "has_rooftop_access" BOOLEAN NOT NULL DEFAULT false,
    "cesium_position" JSONB,
    "bounding_box" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" VARCHAR(120),

    CONSTRAINT "buildings_3d_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_floors" (
    "id" UUID NOT NULL,
    "building_3d_id" UUID NOT NULL,
    "floor_number" INTEGER NOT NULL,
    "display_label" VARCHAR(20),
    "footprint_geojson" JSONB,
    "area_sqm" DOUBLE PRECISION,
    "height_meters" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "total_units" INTEGER NOT NULL DEFAULT 0,
    "available_units" INTEGER NOT NULL DEFAULT 0,
    "for_sale_count" INTEGER NOT NULL DEFAULT 0,
    "for_rent_count" INTEGER NOT NULL DEFAULT 0,
    "for_daily_count" INTEGER NOT NULL DEFAULT 0,
    "for_pledge_count" INTEGER NOT NULL DEFAULT 0,
    "price_per_sqm_min" DOUBLE PRECISION,
    "price_per_sqm_max" DOUBLE PRECISION,
    "price_per_sqm_avg" DOUBLE PRECISION,
    "color" VARCHAR(7),
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_locations" (
    "id" UUID NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "building_3d_id" UUID,
    "building_floor_id" UUID,
    "floor_number" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pos_x" DOUBLE PRECISION,
    "pos_y" DOUBLE PRECISION,
    "cesium_cartesian" JSONB,
    "marker_color" VARCHAR(7),
    "marker_size" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(240) NOT NULL,
    "status" "blog_post_status" NOT NULL DEFAULT 'draft',
    "locale" VARCHAR(8) NOT NULL DEFAULT 'ka',
    "category" VARCHAR(80),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured_image" TEXT,
    "author_id" VARCHAR(120),
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "title_ka" VARCHAR(300) NOT NULL,
    "title_en" VARCHAR(300),
    "title_ru" VARCHAR(300),
    "excerpt_ka" TEXT,
    "excerpt_en" TEXT,
    "excerpt_ru" TEXT,
    "body_ka" TEXT NOT NULL,
    "body_en" TEXT,
    "body_ru" TEXT,
    "meta_title_ka" VARCHAR(300),
    "meta_title_en" VARCHAR(300),
    "meta_title_ru" VARCHAR(300),
    "meta_description_ka" VARCHAR(500),
    "meta_description_en" VARCHAR(500),
    "meta_description_ru" VARCHAR(500),

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" VARCHAR(120) NOT NULL,
    "filename" VARCHAR(240) NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" VARCHAR(80) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" VARCHAR(500),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "uploaded_by_id" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "body" TEXT,
    "action_url" TEXT,
    "read_at" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "name_ka" VARCHAR(120) NOT NULL,
    "region" VARCHAR(120) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lng" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neighborhoods" (
    "id" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "name_ka" VARCHAR(120) NOT NULL,
    "city_id" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "description_ka" TEXT NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "highlights_ka" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price_range_buy" VARCHAR(120) NOT NULL,
    "price_range_rent" VARCHAR(120) NOT NULL,
    "avg_price_per_sqm" INTEGER NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'GEL',
    "walk_score" INTEGER NOT NULL DEFAULT 0,
    "transit_score" INTEGER NOT NULL DEFAULT 0,
    "safety_score" INTEGER NOT NULL DEFAULT 0,
    "schools_nearby" INTEGER NOT NULL DEFAULT 0,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities_ka" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "best_for" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "best_for_ka" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "investment_note" TEXT NOT NULL,
    "investment_note_ka" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lng" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image" TEXT NOT NULL,
    "image_attribution" TEXT,
    "listings_count" INTEGER NOT NULL DEFAULT 0,
    "trend" VARCHAR(12) NOT NULL DEFAULT 'stable',
    "trend_percent" VARCHAR(12) NOT NULL DEFAULT '0%',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "neighborhoods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" VARCHAR(120) NOT NULL,
    "listing_id" VARCHAR(120),
    "title" VARCHAR(240) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "id" VARCHAR(120) NOT NULL,
    "room_id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMPTZ(6),

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" VARCHAR(120) NOT NULL,
    "room_id" VARCHAR(120) NOT NULL,
    "sender_id" VARCHAR(120) NOT NULL,
    "content" TEXT NOT NULL,
    "kind" "chat_message_kind" NOT NULL DEFAULT 'text',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_tours" (
    "id" VARCHAR(120) NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "guest_id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120),
    "agent_id" VARCHAR(120) NOT NULL,
    "tour_date" DATE NOT NULL,
    "tour_time" VARCHAR(10) NOT NULL,
    "status" "tour_status" NOT NULL DEFAULT 'pending',
    "guest_name" VARCHAR(160) NOT NULL,
    "guest_phone" VARCHAR(30) NOT NULL,
    "guest_email" VARCHAR(240),
    "guest_notes" TEXT,
    "agent_notes" TEXT,
    "confirmed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_availabilities" (
    "id" VARCHAR(120) NOT NULL,
    "agent_id" VARCHAR(120) NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" VARCHAR(10) NOT NULL,
    "end_time" VARCHAR(10) NOT NULL,
    "slot_duration" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_date_overrides" (
    "id" VARCHAR(120) NOT NULL,
    "agent_id" VARCHAR(120) NOT NULL,
    "date" DATE NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT true,
    "reason" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_date_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_behaviors" (
    "id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "listing_id" VARCHAR(120),
    "kind" "behavior_kind" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "search_params" JSONB,
    "session_id" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_behaviors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_embeddings" (
    "id" VARCHAR(120) NOT NULL,
    "listing_id" VARCHAR(120) NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "model" VARCHAR(80) NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_embeddings" (
    "id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "model" VARCHAR(80) NOT NULL,
    "behavior_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" VARCHAR(255) NOT NULL,
    "auth" VARCHAR(255) NOT NULL,
    "kind" VARCHAR(20) NOT NULL DEFAULT 'web',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_alert_subscriptions" (
    "id" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "source" VARCHAR(60) NOT NULL DEFAULT 'homepage_cta',
    "confirmed_at" TIMESTAMPTZ(6),
    "unsubscribed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_alert_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "authenticators_credential_id_key" ON "authenticators"("credential_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_nearest_poi_listing_poi_key" ON "listing_nearest_poi"("listing_id", "poi_id");

-- CreateIndex
CREATE INDEX "map_ai_zones_district_idx" ON "map_ai_zones"("district");

-- CreateIndex
CREATE INDEX "map_ai_zones_investment_score_idx" ON "map_ai_zones"("investment_score");

-- CreateIndex
CREATE INDEX "listing_media_listing_position_idx" ON "listing_media"("listing_id", "position");

-- CreateIndex
CREATE INDEX "listing_media_listing_kind_idx" ON "listing_media"("listing_id", "kind");

-- CreateIndex
CREATE INDEX "listing_media_sha256_idx" ON "listing_media"("file_sha256");

-- CreateIndex
CREATE INDEX "listing_media_processing_idx" ON "listing_media"("processing_status", "created_at");

-- CreateIndex
CREATE INDEX "listing_price_events_listing_recorded_idx" ON "listing_price_events"("listing_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "listing_price_events_listing_type_recorded_idx" ON "listing_price_events"("listing_id", "eventType", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "market_snapshot_city_period_idx" ON "market_snapshots"("city", "period_month");

-- CreateIndex
CREATE INDEX "market_snapshot_district_period_idx" ON "market_snapshots"("district", "period_month");

-- CreateIndex
CREATE UNIQUE INDEX "market_snapshot_city_district_period_key" ON "market_snapshots"("city", "district", "period_month");

-- CreateIndex
CREATE UNIQUE INDEX "listings_slug_key" ON "listings"("slug");

-- CreateIndex
CREATE INDEX "listings_deleted_at_idx" ON "listings"("deleted_at");

-- CreateIndex
CREATE INDEX "listings_city_district_idx" ON "listings"("city", "district");

-- CreateIndex
CREATE INDEX "listings_deal_type_idx" ON "listings"("deal_type");

-- CreateIndex
CREATE INDEX "listings_tier_expires_at_idx" ON "listings"("tier_expires_at");

-- CreateIndex
CREATE INDEX "listings_tier_purchased_at_idx" ON "listings"("tier_purchased_at");

-- CreateIndex
CREATE INDEX "listings_search_core_idx" ON "listings"("deal_type", "city", "district", "deleted_at");

-- CreateIndex
CREATE INDEX "listings_property_type_idx" ON "listings"("type", "deleted_at");

-- CreateIndex
CREATE INDEX "listings_price_idx" ON "listings"("price", "deleted_at");

-- CreateIndex
CREATE INDEX "listings_area_idx" ON "listings"("area", "deleted_at");

-- CreateIndex
CREATE INDEX "listings_rooms_idx" ON "listings"("rooms", "deleted_at");

-- CreateIndex
CREATE INDEX "listings_floor_idx" ON "listings"("floor", "deleted_at");

-- CreateIndex
CREATE INDEX "listings_year_built_idx" ON "listings"("year_built", "deleted_at");

-- CreateIndex
CREATE INDEX "listings_created_at_idx" ON "listings"("created_at" DESC, "deleted_at");

-- CreateIndex
CREATE INDEX "listings_verified_idx" ON "listings"("verified", "deleted_at");

-- CreateIndex
CREATE INDEX "listings_trust_score_idx" ON "listings"("trust_score" DESC, "deleted_at");

-- CreateIndex
CREATE INDEX "listings_status_deleted_at_idx" ON "listings"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "listing_boost_history_listing_id_idx" ON "listing_boost_history"("listing_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "listing_boost_history_user_id_idx" ON "listing_boost_history"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "listing_boost_history_expires_at_idx" ON "listing_boost_history"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "daily_rental_settings_listing_id_key" ON "daily_rental_settings"("listing_id");

-- CreateIndex
CREATE INDEX "daily_rental_booking_listing_dates_idx" ON "daily_rental_bookings"("listing_id", "check_in", "check_out");

-- CreateIndex
CREATE INDEX "daily_rental_booking_guest_idx" ON "daily_rental_bookings"("guest_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "daily_rental_booking_status_checkin_idx" ON "daily_rental_bookings"("status", "check_in");

-- CreateIndex
CREATE INDEX "daily_rental_blocked_date_listing_date_idx" ON "daily_rental_blocked_dates"("listing_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_rental_blocked_date_listing_date_key" ON "daily_rental_blocked_dates"("listing_id", "date");

-- CreateIndex
CREATE INDEX "crm_lead_agent_status_idx" ON "crm_leads"("agent_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_lead_agent_followup_idx" ON "crm_leads"("agent_id", "next_follow_up");

-- CreateIndex
CREATE INDEX "crm_activity_lead_idx" ON "crm_activities"("lead_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_task_agent_status_due_idx" ON "crm_tasks"("agent_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "crm_task_lead_idx" ON "crm_tasks"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_providers_slug_key" ON "service_providers"("slug");

-- CreateIndex
CREATE INDEX "service_provider_category_city_idx" ON "service_providers"("category", "city", "is_active");

-- CreateIndex
CREATE INDEX "service_provider_slug_idx" ON "service_providers"("slug");

-- CreateIndex
CREATE INDEX "service_provider_deleted_at_idx" ON "service_providers"("deleted_at");

-- CreateIndex
CREATE INDEX "service_provider_review_provider_idx" ON "service_provider_reviews"("provider_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "saved_listings_user_created_at_idx" ON "saved_listings"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "saved_listings_listing_id_idx" ON "saved_listings"("listing_id");

-- CreateIndex
CREATE INDEX "saved_listings_deleted_at_idx" ON "saved_listings"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "saved_listings_user_listing_key" ON "saved_listings"("user_id", "listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "developer_profiles_slug_key" ON "developer_profiles"("slug");

-- CreateIndex
CREATE INDEX "developer_profiles_deleted_at_idx" ON "developer_profiles"("deleted_at");

-- CreateIndex
CREATE INDEX "developer_profiles_owner_id_idx" ON "developer_profiles"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_slug_key" ON "agent_profiles"("slug");

-- CreateIndex
CREATE INDEX "agent_profiles_deleted_at_idx" ON "agent_profiles"("deleted_at");

-- CreateIndex
CREATE INDEX "agent_profiles_owner_id_idx" ON "agent_profiles"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_directories_slug_key" ON "project_directories"("slug");

-- CreateIndex
CREATE INDEX "project_directories_deleted_at_idx" ON "project_directories"("deleted_at");

-- CreateIndex
CREATE INDEX "project_directories_owner_id_idx" ON "project_directories"("owner_id");

-- CreateIndex
CREATE INDEX "project_directories_city_idx" ON "project_directories"("city");

-- CreateIndex
CREATE UNIQUE INDEX "agency_profiles_slug_key" ON "agency_profiles"("slug");

-- CreateIndex
CREATE INDEX "agency_profiles_deleted_at_idx" ON "agency_profiles"("deleted_at");

-- CreateIndex
CREATE INDEX "agency_profiles_owner_id_idx" ON "agency_profiles"("owner_id");

-- CreateIndex
CREATE INDEX "agency_profiles_city_idx" ON "agency_profiles"("city");

-- CreateIndex
CREATE UNIQUE INDEX "auctions_short_public_code_key" ON "auctions"("short_public_code");

-- CreateIndex
CREATE UNIQUE INDEX "auctions_listing_id_key" ON "auctions"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "auctions_winning_bid_id_key" ON "auctions"("winning_bid_id");

-- CreateIndex
CREATE INDEX "auctions_status_ends_at_idx" ON "auctions"("status", "ends_at");

-- CreateIndex
CREATE INDEX "auctions_organizer_id_idx" ON "auctions"("organizer_id");

-- CreateIndex
CREATE INDEX "auctions_ends_at_idx" ON "auctions"("ends_at");

-- CreateIndex
CREATE INDEX "auctions_winner_user_id_idx" ON "auctions"("winner_user_id");

-- CreateIndex
CREATE INDEX "auction_deposits_auction_status_idx" ON "auction_deposits"("auction_id", "status");

-- CreateIndex
CREATE INDEX "auction_deposits_bidder_id_idx" ON "auction_deposits"("bidder_id");

-- CreateIndex
CREATE UNIQUE INDEX "auction_deposits_auction_bidder_key" ON "auction_deposits"("auction_id", "bidder_id");

-- CreateIndex
CREATE INDEX "bids_auction_placed_at_idx" ON "bids"("auction_id", "placed_at" DESC);

-- CreateIndex
CREATE INDEX "bids_bidder_placed_at_idx" ON "bids"("bidder_id", "placed_at" DESC);

-- CreateIndex
CREATE INDEX "bids_auction_amount_idx" ON "bids"("auction_id", "amount_tetri" DESC);

-- CreateIndex
CREATE INDEX "auction_watchers_auction_id_idx" ON "auction_watchers"("auction_id");

-- CreateIndex
CREATE UNIQUE INDEX "forum_threads_slug_key" ON "forum_threads"("slug");

-- CreateIndex
CREATE INDEX "forum_threads_deleted_at_idx" ON "forum_threads"("deleted_at");

-- CreateIndex
CREATE INDEX "forum_threads_slug_idx" ON "forum_threads"("slug");

-- CreateIndex
CREATE INDEX "forum_threads_last_activity_at_idx" ON "forum_threads"("last_activity_at" DESC);

-- CreateIndex
CREATE INDEX "forum_threads_district_idx" ON "forum_threads"("district");

-- CreateIndex
CREATE INDEX "forum_replies_deleted_at_idx" ON "forum_replies"("deleted_at");

-- CreateIndex
CREATE INDEX "forum_replies_thread_id_idx" ON "forum_replies"("thread_id");

-- CreateIndex
CREATE INDEX "inquiries_listing_id_idx" ON "inquiries"("listing_id");

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- CreateIndex
CREATE INDEX "inquiries_marketplace_idx" ON "inquiries"("is_for_sale", "quality_score" DESC);

-- CreateIndex
CREATE INDEX "inquiries_quality_created_idx" ON "inquiries"("quality_score" DESC, "created_at" DESC);

-- CreateIndex
CREATE INDEX "lead_purchases_buyer_purchased_idx" ON "lead_purchases"("buyer_id", "purchased_at" DESC);

-- CreateIndex
CREATE INDEX "lead_purchases_inquiry_id_idx" ON "lead_purchases"("inquiry_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_purchases_inquiry_buyer_key" ON "lead_purchases"("inquiry_id", "buyer_id");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE INDEX "saved_search_alert_logs_search_created_idx" ON "saved_search_alert_logs"("saved_search_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "saved_search_alert_logs_unique_idx" ON "saved_search_alert_logs"("saved_search_id", "listing_id");

-- CreateIndex
CREATE INDEX "reviews_target_idx" ON "reviews"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_orders_session_id_key" ON "stripe_orders"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_user_id_key" ON "stripe_customers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_stripe_customer_id_key" ON "stripe_customers"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_customer_idx" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_period_end_idx" ON "subscriptions"("status", "current_period_end");

-- CreateIndex
CREATE INDEX "georgian_payment_orders_provider_provider_payment_id_idx" ON "georgian_payment_orders"("provider", "provider_payment_id");

-- CreateIndex
CREATE INDEX "georgian_payment_orders_status_created_at_idx" ON "georgian_payment_orders"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "georgian_payment_orders_listing_id_idx" ON "georgian_payment_orders"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "georgian_payment_orders_provider_order_id_key" ON "georgian_payment_orders"("provider", "provider_order_id");

-- CreateIndex
CREATE INDEX "verification_requests_status_created_at_idx" ON "verification_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "verification_requests_subject_idx" ON "verification_requests"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "verification_audit_logs_request_id_idx" ON "verification_audit_logs"("verification_request_id");

-- CreateIndex
CREATE INDEX "recommendation_audit_created_at_idx" ON "recommendation_audit"("created_at" DESC);

-- CreateIndex
CREATE INDEX "recommendation_audit_recommendation_id_idx" ON "recommendation_audit"("recommendation_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_idx" ON "admin_audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actor_created_idx" ON "admin_audit_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "partners_slug_key" ON "partners"("slug");

-- CreateIndex
CREATE INDEX "partner_mappings_partner_idx" ON "partner_mappings"("partner_id", "status");

-- CreateIndex
CREATE INDEX "partner_mappings_listing_idx" ON "partner_mappings"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_mappings_partner_listing_key" ON "partner_mappings"("partner_id", "listing_id");

-- CreateIndex
CREATE INDEX "import_jobs_partner_idx" ON "import_jobs"("partner_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "export_jobs_partner_idx" ON "export_jobs"("partner_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "import_staging_job_idx" ON "import_staging"("import_job_id", "status");

-- CreateIndex
CREATE INDEX "import_staging_external_idx" ON "import_staging"("external_id");

-- CreateIndex
CREATE INDEX "syndication_rules_partner_idx" ON "syndication_rules"("partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_short_id_key" ON "complaints"("short_id");

-- CreateIndex
CREATE INDEX "complaints_status_priority_created_at_idx" ON "complaints"("status", "priority" DESC, "created_at");

-- CreateIndex
CREATE INDEX "complaints_subject_listing_id_idx" ON "complaints"("subject_listing_id");

-- CreateIndex
CREATE INDEX "complaints_subject_user_id_idx" ON "complaints"("subject_user_id");

-- CreateIndex
CREATE INDEX "complaints_assigned_to_status_idx" ON "complaints"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "complaints_kind_created_at_idx" ON "complaints"("kind", "created_at" DESC);

-- CreateIndex
CREATE INDEX "moderation_queue_status_priority_created_at_idx" ON "moderation_queue"("status", "priority" DESC, "created_at");

-- CreateIndex
CREATE INDEX "moderation_queue_assigned_to_status_idx" ON "moderation_queue"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "moderation_queue_subject_listing_id_idx" ON "moderation_queue"("subject_listing_id");

-- CreateIndex
CREATE INDEX "moderation_queue_priority_created_at_idx" ON "moderation_queue"("priority" DESC, "created_at" DESC);

-- CreateIndex
CREATE INDEX "moderation_actions_moderator_created_at_idx" ON "moderation_actions"("moderator_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "moderation_actions_subject_kind_id_idx" ON "moderation_actions"("subject_kind", "subject_id");

-- CreateIndex
CREATE INDEX "fraud_signals_subject_kind_id_idx" ON "fraud_signals"("subject_kind", "subject_id");

-- CreateIndex
CREATE INDEX "fraud_signals_signal_kind_detected_at_idx" ON "fraud_signals"("signal_kind", "detected_at" DESC);

-- CreateIndex
CREATE INDEX "fraud_signals_severity_detected_at_idx" ON "fraud_signals"("severity" DESC, "detected_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "duplicate_clusters_cluster_signature_key" ON "duplicate_clusters"("cluster_signature");

-- CreateIndex
CREATE INDEX "duplicate_cluster_members_listing_id_idx" ON "duplicate_cluster_members"("listing_id");

-- CreateIndex
CREATE INDEX "shadow_bans_user_active_idx" ON "shadow_bans"("user_id", "active");

-- CreateIndex
CREATE INDEX "suspicious_activity_user_occurred_at_idx" ON "suspicious_activity_log"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "suspicious_activity_kind_occurred_at_idx" ON "suspicious_activity_log"("activity_kind", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "map_buildings_status_created_idx" ON "map_buildings"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "buildings_3d_map_building_id_key" ON "buildings_3d"("map_building_id");

-- CreateIndex
CREATE INDEX "building_3d_status_year_idx" ON "buildings_3d"("status", "year_built");

-- CreateIndex
CREATE INDEX "building_3d_developer_idx" ON "buildings_3d"("developer_id");

-- CreateIndex
CREATE INDEX "building_3d_ready_idx" ON "buildings_3d"("ready_by");

-- CreateIndex
CREATE INDEX "building_floor_building_num_idx" ON "building_floors"("building_3d_id", "floor_number");

-- CreateIndex
CREATE UNIQUE INDEX "building_floor_unique_idx" ON "building_floors"("building_3d_id", "floor_number");

-- CreateIndex
CREATE UNIQUE INDEX "listing_locations_listing_id_key" ON "listing_locations"("listing_id");

-- CreateIndex
CREATE INDEX "listing_loc_building_floor_idx" ON "listing_locations"("building_3d_id", "floor_number");

-- CreateIndex
CREATE INDEX "listing_loc_lat_lng_idx" ON "listing_locations"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_locale_idx" ON "blog_posts"("status", "locale");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts"("published_at");

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");

-- CreateIndex
CREATE INDEX "media_assets_mime_type_idx" ON "media_assets"("mime_type");

-- CreateIndex
CREATE INDEX "media_assets_created_at_idx" ON "media_assets"("created_at");

-- CreateIndex
CREATE INDEX "media_assets_tags_idx" ON "media_assets"("tags");

-- CreateIndex
CREATE INDEX "notifications_user_read_created_idx" ON "notifications"("user_id", "read_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_kind_created_idx" ON "notifications"("kind", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_active_order_idx" ON "cities"("is_active", "order");

-- CreateIndex
CREATE UNIQUE INDEX "neighborhoods_slug_key" ON "neighborhoods"("slug");

-- CreateIndex
CREATE INDEX "neighborhoods_city_active_order_idx" ON "neighborhoods"("city_id", "is_active", "order");

-- CreateIndex
CREATE INDEX "neighborhoods_slug_active_idx" ON "neighborhoods"("slug", "is_active");

-- CreateIndex
CREATE INDEX "neighborhoods_featured_order_idx" ON "neighborhoods"("featured", "order");

-- CreateIndex
CREATE INDEX "chat_rooms_listing_status_idx" ON "chat_rooms"("listing_id", "status");

-- CreateIndex
CREATE INDEX "chat_rooms_status_updated_idx" ON "chat_rooms"("status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "chat_participants_user_joined_idx" ON "chat_participants"("user_id", "joined_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "chat_participants_room_user_key" ON "chat_participants"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_messages_room_created_idx" ON "chat_messages"("room_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "chat_messages_sender_created_idx" ON "chat_messages"("sender_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "property_tours_listing_date_idx" ON "property_tours"("listing_id", "tour_date");

-- CreateIndex
CREATE INDEX "property_tours_agent_date_status_idx" ON "property_tours"("agent_id", "tour_date", "status");

-- CreateIndex
CREATE INDEX "property_tours_guest_idx" ON "property_tours"("guest_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "property_tours_user_idx" ON "property_tours"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "property_tours_status_date_idx" ON "property_tours"("status", "tour_date");

-- CreateIndex
CREATE INDEX "tour_availability_agent_day_active_idx" ON "tour_availabilities"("agent_id", "day_of_week", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "tour_availability_agent_day_time_key" ON "tour_availabilities"("agent_id", "day_of_week", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "tour_date_override_agent_date_idx" ON "tour_date_overrides"("agent_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "tour_date_override_agent_date_key" ON "tour_date_overrides"("agent_id", "date");

-- CreateIndex
CREATE INDEX "user_behaviors_user_kind_created_idx" ON "user_behaviors"("user_id", "kind", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_behaviors_user_created_idx" ON "user_behaviors"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_behaviors_listing_kind_created_idx" ON "user_behaviors"("listing_id", "kind", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_behaviors_session_created_idx" ON "user_behaviors"("session_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "listing_embeddings_listing_id_key" ON "listing_embeddings"("listing_id");

-- CreateIndex
CREATE INDEX "listing_embeddings_listing_id_idx" ON "listing_embeddings"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_embeddings_user_id_key" ON "user_embeddings"("user_id");

-- CreateIndex
CREATE INDEX "user_embeddings_user_id_idx" ON "user_embeddings"("user_id");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_active_idx" ON "push_subscriptions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "push_subscriptions_active_updated_idx" ON "push_subscriptions"("is_active", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_user_endpoint_key" ON "push_subscriptions"("user_id", "endpoint");

-- CreateIndex
CREATE INDEX "listing_alert_subs_email_created_idx" ON "listing_alert_subscriptions"("email", "created_at");

-- CreateIndex
CREATE INDEX "listing_alert_subs_created_idx" ON "listing_alert_subscriptions"("created_at");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_nearest_poi" ADD CONSTRAINT "listing_nearest_poi_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_nearest_poi" ADD CONSTRAINT "listing_nearest_poi_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_price_events" ADD CONSTRAINT "listing_price_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_boost_history" ADD CONSTRAINT "listing_boost_history_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_rental_settings" ADD CONSTRAINT "daily_rental_settings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_rental_bookings" ADD CONSTRAINT "daily_rental_bookings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_rental_blocked_dates" ADD CONSTRAINT "daily_rental_blocked_dates_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_provider_reviews" ADD CONSTRAINT "service_provider_reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_winner_user_id_fkey" FOREIGN KEY ("winner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_deposits" ADD CONSTRAINT "auction_deposits_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_deposits" ADD CONSTRAINT "auction_deposits_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_deposits" ADD CONSTRAINT "auction_deposits_payment_order_id_fkey" FOREIGN KEY ("payment_order_id") REFERENCES "georgian_payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "auction_deposits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_watchers" ADD CONSTRAINT "auction_watchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_watchers" ADD CONSTRAINT "auction_watchers_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_purchases" ADD CONSTRAINT "lead_purchases_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_customers" ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_stripe_customer_id_fkey" FOREIGN KEY ("stripe_customer_id") REFERENCES "stripe_customers"("stripe_customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_audit_logs" ADD CONSTRAINT "verification_audit_logs_verification_request_id_fkey" FOREIGN KEY ("verification_request_id") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_mappings" ADD CONSTRAINT "partner_mappings_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_mappings" ADD CONSTRAINT "partner_mappings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_agency_profile_id_fkey" FOREIGN KEY ("agency_profile_id") REFERENCES "agency_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_developer_profile_id_fkey" FOREIGN KEY ("developer_profile_id") REFERENCES "developer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_staging" ADD CONSTRAINT "import_staging_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_staging" ADD CONSTRAINT "import_staging_matched_listing_id_fkey" FOREIGN KEY ("matched_listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_category_mappings" ADD CONSTRAINT "partner_category_mappings_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syndication_rules" ADD CONSTRAINT "syndication_rules_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_subject_listing_id_fkey" FOREIGN KEY ("subject_listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_subject_user_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_subject_review_id_fkey" FOREIGN KEY ("subject_review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_subject_agency_profile_id_fkey" FOREIGN KEY ("subject_agency_profile_id") REFERENCES "agency_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_subject_developer_profile_id_fkey" FOREIGN KEY ("subject_developer_profile_id") REFERENCES "developer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_subject_project_directory_id_fkey" FOREIGN KEY ("subject_project_directory_id") REFERENCES "project_directories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_duplicate_of_fkey" FOREIGN KEY ("duplicate_of") REFERENCES "complaints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_subject_listing_id_fkey" FOREIGN KEY ("subject_listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_subject_review_id_fkey" FOREIGN KEY ("subject_review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_subject_user_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_subject_media_id_fkey" FOREIGN KEY ("subject_media_id") REFERENCES "listing_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_related_complaint_id_fkey" FOREIGN KEY ("related_complaint_id") REFERENCES "complaints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_related_moderation_queue_id_fkey" FOREIGN KEY ("related_moderation_queue_id") REFERENCES "moderation_queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocklist_phones" ADD CONSTRAINT "blocklist_phones_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocklist_emails" ADD CONSTRAINT "blocklist_emails_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocklist_ips" ADD CONSTRAINT "blocklist_ips_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocklist_devices" ADD CONSTRAINT "blocklist_devices_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_signals" ADD CONSTRAINT "fraud_signals_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_clusters" ADD CONSTRAINT "duplicate_clusters_representative_listing_id_fkey" FOREIGN KEY ("representative_listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_cluster_members" ADD CONSTRAINT "duplicate_cluster_members_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "duplicate_clusters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_cluster_members" ADD CONSTRAINT "duplicate_cluster_members_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_bans" ADD CONSTRAINT "shadow_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_bans" ADD CONSTRAINT "shadow_bans_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_bans" ADD CONSTRAINT "shadow_bans_lifted_by_fkey" FOREIGN KEY ("lifted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspicious_activity_log" ADD CONSTRAINT "suspicious_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings_3d" ADD CONSTRAINT "buildings_3d_map_building_id_fkey" FOREIGN KEY ("map_building_id") REFERENCES "map_buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings_3d" ADD CONSTRAINT "buildings_3d_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "developer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings_3d" ADD CONSTRAINT "buildings_3d_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_floors" ADD CONSTRAINT "building_floors_building_3d_id_fkey" FOREIGN KEY ("building_3d_id") REFERENCES "buildings_3d"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_locations" ADD CONSTRAINT "listing_locations_building_3d_id_fkey" FOREIGN KEY ("building_3d_id") REFERENCES "buildings_3d"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_locations" ADD CONSTRAINT "listing_locations_building_floor_id_fkey" FOREIGN KEY ("building_floor_id") REFERENCES "building_floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_locations" ADD CONSTRAINT "listing_locations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_tours" ADD CONSTRAINT "property_tours_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_tours" ADD CONSTRAINT "property_tours_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_tours" ADD CONSTRAINT "property_tours_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_availabilities" ADD CONSTRAINT "tour_availabilities_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_date_overrides" ADD CONSTRAINT "tour_date_overrides_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_behaviors" ADD CONSTRAINT "user_behaviors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_behaviors" ADD CONSTRAINT "user_behaviors_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_embeddings" ADD CONSTRAINT "listing_embeddings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_embeddings" ADD CONSTRAINT "user_embeddings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
