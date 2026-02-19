-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('COMMUNITY', 'USER');

-- CreateEnum
CREATE TYPE "RoomPersistence" AS ENUM ('EPHEMERAL', 'PERSISTENT');

-- AlterEnum
ALTER TYPE "RoomVisibility" ADD VALUE 'UNLISTED';

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "liveCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "persistence" "RoomPersistence" NOT NULL DEFAULT 'PERSISTENT',
ADD COLUMN     "roomType" "RoomType" NOT NULL DEFAULT 'USER',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "RoomParticipant" ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Room_roomType_idx" ON "Room"("roomType");

-- CreateIndex
CREATE INDEX "Room_lastActivity_idx" ON "Room"("lastActivity");

-- CreateIndex
CREATE INDEX "Room_liveCount_idx" ON "Room"("liveCount");

-- CreateIndex
CREATE INDEX "RoomParticipant_isOnline_idx" ON "RoomParticipant"("isOnline");
