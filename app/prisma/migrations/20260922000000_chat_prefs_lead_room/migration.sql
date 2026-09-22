-- Chat per-participant prefs (mute, archive) + Inquiry → ChatRoom link.
ALTER TABLE "chat_participants" ADD COLUMN "muted_at" TIMESTAMPTZ(6);
ALTER TABLE "chat_participants" ADD COLUMN "archived_at" TIMESTAMPTZ(6);

ALTER TABLE "inquiries" ADD COLUMN "room_id" VARCHAR(120);
CREATE INDEX "inquiries_room_id_idx" ON "inquiries"("room_id");
