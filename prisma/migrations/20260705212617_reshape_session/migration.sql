-- Roll-your-own sessions: replace Lucia's active/idle expiry pair with a single
-- expires_at timestamp. Existing sessions are dropped (everyone signs out).
DELETE FROM "auth_session";

ALTER TABLE "auth_session" DROP COLUMN "active_expires";
ALTER TABLE "auth_session" DROP COLUMN "idle_expires";
ALTER TABLE "auth_session" ADD COLUMN "expires_at" TIMESTAMP(3) NOT NULL;
