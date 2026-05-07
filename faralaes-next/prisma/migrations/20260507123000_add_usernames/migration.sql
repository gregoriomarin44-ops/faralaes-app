ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;

WITH generated AS (
  SELECT
    u."id",
    COALESCE(
      NULLIF(
        LOWER(REGEXP_REPLACE(SPLIT_PART(u."email", '@', 1), '[^a-zA-Z0-9_]', '_', 'g')),
        ''
      ),
      'usuario'
    ) AS base_username,
    COALESCE(NULLIF(p."displayName", ''), SPLIT_PART(u."email", '@', 1), 'Usuario') AS generated_display_name,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(
        NULLIF(
          LOWER(REGEXP_REPLACE(SPLIT_PART(u."email", '@', 1), '[^a-zA-Z0-9_]', '_', 'g')),
          ''
        ),
        'usuario'
      )
      ORDER BY u."createdAt", u."id"
    ) AS duplicate_index
  FROM "User" u
  LEFT JOIN "Profile" p ON p."userId" = u."id"
)
UPDATE "User" u
SET
  "username" = CASE
    WHEN LENGTH(g.base_username) >= 3 AND g.duplicate_index = 1 THEN g.base_username
    WHEN LENGTH(g.base_username) >= 3 THEN g.base_username || '_' || SUBSTRING(u."id"::TEXT, 1, 8)
    ELSE 'usuario_' || SUBSTRING(u."id"::TEXT, 1, 8)
  END,
  "displayName" = g.generated_display_name
FROM generated g
WHERE u."id" = g."id";

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "displayName" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
