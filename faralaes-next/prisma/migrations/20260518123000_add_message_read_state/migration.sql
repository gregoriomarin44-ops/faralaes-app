-- AlterTable
ALTER TABLE "Message" ADD COLUMN "receiverId" UUID;
ALTER TABLE "Message" ADD COLUMN "readAt" TIMESTAMP(3);

-- Backfill receiverId for existing one-to-one conversation messages.
UPDATE "Message"
SET "receiverId" = CASE
    WHEN "Message"."senderId" = "Conversation"."buyerId" THEN "Conversation"."sellerId"
    ELSE "Conversation"."buyerId"
END
FROM "Conversation"
WHERE "Message"."conversationId" = "Conversation"."id";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "receiverId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Message_receiverId_readAt_idx" ON "Message"("receiverId", "readAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_receiverId_readAt_idx" ON "Message"("conversationId", "receiverId", "readAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
