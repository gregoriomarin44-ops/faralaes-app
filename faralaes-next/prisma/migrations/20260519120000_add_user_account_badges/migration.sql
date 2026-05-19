ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountType" TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_accountType_check'
  ) THEN
    ALTER TABLE "User"
    ADD CONSTRAINT "User_accountType_check"
    CHECK ("accountType" IN ('individual', 'shop', 'designer'));
  END IF;
END $$;
