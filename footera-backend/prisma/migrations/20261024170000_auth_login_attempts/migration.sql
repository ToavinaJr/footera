CREATE TABLE "auth_login_attempts" (
    "id" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "auth_login_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_login_attempts_expiresAt_idx" ON "auth_login_attempts"("expiresAt");
