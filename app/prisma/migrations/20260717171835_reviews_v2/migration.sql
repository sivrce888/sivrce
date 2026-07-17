-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "helpful_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locale" VARCHAR(8) NOT NULL DEFAULT 'ka',
ADD COLUMN     "owner_reply" TEXT,
ADD COLUMN     "owner_reply_at" TIMESTAMPTZ(6),
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'published',
ADD COLUMN     "title" VARCHAR(200);

-- CreateTable
CREATE TABLE "review_helpful_votes" (
    "id" VARCHAR(120) NOT NULL,
    "review_id" VARCHAR(120) NOT NULL,
    "voter_key" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_helpful_votes_review_id_idx" ON "review_helpful_votes"("review_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_helpful_votes_review_voter_key" ON "review_helpful_votes"("review_id", "voter_key");

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
