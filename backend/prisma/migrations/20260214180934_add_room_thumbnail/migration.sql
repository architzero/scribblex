-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "thumbnail" TEXT;

-- CreateIndex
CREATE INDEX "Room_visibility_idx" ON "Room"("visibility");
