-- CreateTable
CREATE TABLE "room" (
    "id" BIGINT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "time" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "privacy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_ownerId_idx" ON "room"("ownerId");

-- CreateIndex
CREATE INDEX "room_status_idx" ON "room"("status");

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
