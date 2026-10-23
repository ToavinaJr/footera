CREATE TABLE "auth_credentials" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "auth_credentials_pkey" PRIMARY KEY ("id")
);
