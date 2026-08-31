-- Phone login needs a unique identity. Keep the oldest row per number.
UPDATE "users" u
SET "phone" = NULL, "phone_verified_at" = NULL
WHERE u."phone" IS NOT NULL
  AND u."id" NOT IN (
    SELECT DISTINCT ON ("phone") "id"
    FROM "users"
    WHERE "phone" IS NOT NULL
    ORDER BY "phone", "created_at" ASC
  );

CREATE UNIQUE INDEX "users_phone_key" ON "users" ("phone");
