-- CreateTable
CREATE TABLE "chat_typing" (
    "room_id" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_typing_pkey" PRIMARY KEY ("room_id","user_id")
);

-- CreateIndex
CREATE INDEX "chat_typing_updated_idx" ON "chat_typing"("updated_at");

-- AddForeignKey
ALTER TABLE "chat_typing" ADD CONSTRAINT "chat_typing_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
