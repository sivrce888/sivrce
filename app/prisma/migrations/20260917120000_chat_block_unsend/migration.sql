-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "chat_blocks" (
    "blocker_id" VARCHAR(120) NOT NULL,
    "blocked_id" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_blocks_pkey" PRIMARY KEY ("blocker_id","blocked_id")
);

-- CreateIndex
CREATE INDEX "chat_blocks_blocked_idx" ON "chat_blocks"("blocked_id");

-- AddForeignKey
ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
