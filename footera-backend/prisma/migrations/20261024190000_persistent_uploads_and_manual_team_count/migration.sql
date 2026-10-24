CREATE TABLE "uploaded_images" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uploaded_images_pkey" PRIMARY KEY ("id")
);

DELETE FROM "catalogs" WHERE "id" = 'tournament-team-counts';