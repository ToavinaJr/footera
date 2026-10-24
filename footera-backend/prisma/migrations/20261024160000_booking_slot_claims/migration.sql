CREATE TABLE "booking_slot_claims" (
    "id" TEXT NOT NULL,
    "pitchId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    CONSTRAINT "booking_slot_claims_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_slot_claims_bookingId_key" ON "booking_slot_claims"("bookingId");
CREATE UNIQUE INDEX "booking_slot_claims_pitchId_dateKey_time_key" ON "booking_slot_claims"("pitchId", "dateKey", "time");

INSERT INTO "booking_slot_claims" ("id", "pitchId", "dateKey", "time", "bookingId")
SELECT 'legacy_' || md5("id"), payload->>'pitchId', payload->>'date', payload->>'time', "id"
FROM "bookings"
WHERE payload->>'status' IS DISTINCT FROM 'CANCELLED'
  AND payload->>'pitchId' IS NOT NULL
  AND payload->>'time' IS NOT NULL
  AND payload->>'date' ~ '^\d{4}-\d{2}-\d{2}$'
ON CONFLICT DO NOTHING;
