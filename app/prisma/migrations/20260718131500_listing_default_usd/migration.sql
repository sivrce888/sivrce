-- USD is the default listing currency (GEL remains selectable per listing).
ALTER TABLE "listings" ALTER COLUMN "currency" SET DEFAULT 'USD';
