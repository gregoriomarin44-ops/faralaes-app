-- Keep one review per reviewer/reviewed user pair and link reviews to conversations.
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_listingId_fkey";

DROP INDEX IF EXISTS "Review_reviewerId_reviewedUserId_listingId_key";
DROP INDEX IF EXISTS "Review_listingId_idx";

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "conversationId" UUID;

UPDATE "Review" r
SET "conversationId" = c."id"
FROM "Conversation" c
WHERE r."conversationId" IS NULL
  AND (
    (c."buyerId" = r."reviewerId" AND c."sellerId" = r."reviewedUserId")
    OR (c."sellerId" = r."reviewerId" AND c."buyerId" = r."reviewedUserId")
  );

DELETE FROM "Review"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (
        PARTITION BY "reviewerId", "reviewedUserId"
        ORDER BY "createdAt" ASC, "id" ASC
      ) AS duplicate_rank
    FROM "Review"
  ) ranked_reviews
  WHERE duplicate_rank > 1
);

ALTER TABLE "Review" DROP COLUMN IF EXISTS "listingId";
ALTER TABLE "Review" DROP COLUMN IF EXISTS "updatedAt";

CREATE UNIQUE INDEX "Review_reviewerId_reviewedUserId_key" ON "Review"("reviewerId", "reviewedUserId");
CREATE INDEX "Review_conversationId_idx" ON "Review"("conversationId");

ALTER TABLE "Review" ADD CONSTRAINT "Review_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
