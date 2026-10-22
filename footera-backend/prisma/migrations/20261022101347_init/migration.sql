CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pitches" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "pitches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recruitment_ads" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "recruitment_ads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "marketplace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "league_standings" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "league_standings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_feed" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "activity_feed_pkey" PRIMARY KEY ("id")
);
