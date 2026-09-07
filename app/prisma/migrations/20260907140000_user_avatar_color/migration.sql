-- User-picked monogram gradient ("#rrggbb"); mutually exclusive with avatar_style.
ALTER TABLE "users" ADD COLUMN "avatar_color" VARCHAR(7);
