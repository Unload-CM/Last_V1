/*
  Warnings:

  - You are about to drop the column `previousAssigneeId` on the `Issue` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_previousAssigneeId_fkey";

-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "previousAssigneeId",
ADD COLUMN     "solverId" INTEGER;

-- CreateIndex
CREATE INDEX "Issue_solverId_idx" ON "Issue"("solverId");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_solverId_fkey" FOREIGN KEY ("solverId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
