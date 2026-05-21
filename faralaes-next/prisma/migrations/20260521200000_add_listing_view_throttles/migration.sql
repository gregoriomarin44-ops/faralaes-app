CREATE TABLE IF NOT EXISTS "ListingView" (
  "id" UUID NOT NULL,
  "listingId" UUID NOT NULL,
  "userId" UUID,
  "anonymousId" TEXT,
  "lastViewedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ListingView_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ListingView_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ListingView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ListingView_listingId_userId_key" ON "ListingView"("listingId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ListingView_listingId_anonymousId_key" ON "ListingView"("listingId", "anonymousId");
CREATE INDEX IF NOT EXISTS "ListingView_userId_lastViewedAt_idx" ON "ListingView"("userId", "lastViewedAt");
CREATE INDEX IF NOT EXISTS "ListingView_anonymousId_lastViewedAt_idx" ON "ListingView"("anonymousId", "lastViewedAt");
