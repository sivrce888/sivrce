-- Per-day VIP checkout: duration rides on the order so finalize can apply the paid window.
ALTER TABLE "georgian_payment_orders"
  ADD COLUMN IF NOT EXISTS "duration_days" INTEGER NOT NULL DEFAULT 30;
