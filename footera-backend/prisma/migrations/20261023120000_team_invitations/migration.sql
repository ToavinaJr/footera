CREATE TABLE "team_invitations" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);
