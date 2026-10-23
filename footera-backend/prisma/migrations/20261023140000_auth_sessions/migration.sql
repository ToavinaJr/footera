CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);
