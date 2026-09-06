-- One review per author per target: blocks authenticated review-bombing.
-- Legacy anonymous rows keep author_id NULL, which Postgres unique treats as distinct.
CREATE UNIQUE INDEX "reviews_target_author_key" ON "reviews"("target_type", "target_id", "author_id");
