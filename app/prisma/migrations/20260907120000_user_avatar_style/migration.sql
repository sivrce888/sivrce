-- Chosen avatar gradient (index into lib/avatar PAIRS); NULL = auto from name.
ALTER TABLE "users" ADD COLUMN "avatar_style" INTEGER;
