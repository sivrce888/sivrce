-- Lead OS: staff assignment, detected-requirements meta + chat provenance on
-- inquiries; project-scoped chat rooms for buyer ↔ developer conversations.
ALTER TABLE "inquiries" ADD COLUMN "source" VARCHAR(20) NOT NULL DEFAULT 'form';
ALTER TABLE "inquiries" ADD COLUMN "assigned_to" VARCHAR(120);
ALTER TABLE "inquiries" ADD COLUMN "meta" JSONB;
CREATE INDEX "inquiries_assigned_to_idx" ON "inquiries"("assigned_to");

ALTER TABLE "chat_rooms" ADD COLUMN "project_slug" VARCHAR(140);
CREATE INDEX "chat_rooms_project_slug_idx" ON "chat_rooms"("project_slug");
