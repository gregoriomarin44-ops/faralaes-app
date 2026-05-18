-- CreateTable
CREATE TABLE "MessageEmailNotification" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageEmailNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageEmailNotification_conversationId_receiverId_key" ON "MessageEmailNotification"("conversationId", "receiverId");

-- CreateIndex
CREATE INDEX "MessageEmailNotification_receiverId_lastSentAt_idx" ON "MessageEmailNotification"("receiverId", "lastSentAt");

-- AddForeignKey
ALTER TABLE "MessageEmailNotification" ADD CONSTRAINT "MessageEmailNotification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageEmailNotification" ADD CONSTRAINT "MessageEmailNotification_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
