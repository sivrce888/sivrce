-- Chosen avatar glyph (key into lib/avatar ICONS); NULL = initials.
ALTER TABLE "users" ADD COLUMN "avatar_icon" VARCHAR(24);
