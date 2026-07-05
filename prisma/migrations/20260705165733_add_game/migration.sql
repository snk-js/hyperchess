-- CreateTable
CREATE TABLE "game" (
    "id" TEXT NOT NULL,
    "roomId" BIGINT,
    "whitePlayerId" TEXT NOT NULL,
    "blackPlayerId" TEXT NOT NULL,
    "board" JSONB NOT NULL,
    "turn" TEXT NOT NULL DEFAULT 'white',
    "status" TEXT NOT NULL DEFAULT 'active',
    "winnerId" TEXT,
    "moves" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_status_idx" ON "game"("status");

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
