-- Consolidate service-provider reviews into the universal reviews table
-- (target_type='service'). The table was empty in every environment, so no
-- rows are migrated — the drop is pure schema cleanup.
DROP TABLE IF EXISTS "service_provider_reviews";
