/*
  Warnings:

  - You are about to drop the column `comment` on the `IssueHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newValue` on the `IssueHistory` table. All the data in the column will be lost.
  - You are about to drop the column `previousValue` on the `IssueHistory` table. All the data in the column will be lost.
  - Added the required column `summary` to the `IssueHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `IssueHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "IssueHistory" DROP CONSTRAINT "IssueHistory_issueId_fkey";

-- AlterTable
ALTER TABLE "IssueAttachment" ADD COLUMN     "description" TEXT,
ADD COLUMN     "historyId" INTEGER,
ADD COLUMN     "thumbnailPath" TEXT,
ADD COLUMN     "uploaderId" INTEGER;

-- AlterTable
ALTER TABLE "IssueComment" ADD COLUMN     "historyId" INTEGER;

-- AlterTable
ALTER TABLE "IssueHistory" DROP COLUMN "comment",
DROP COLUMN "newValue",
DROP COLUMN "previousValue",
ADD COLUMN     "actionTaken" TEXT,
ADD COLUMN     "newData" JSONB,
ADD COLUMN     "preventiveMeasure" TEXT,
ADD COLUMN     "previousData" JSONB,
ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "rootCause" TEXT,
ADD COLUMN     "summary" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "IssueCommentAttachment" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "description" TEXT,
    "thumbnailPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentId" INTEGER NOT NULL,

    CONSTRAINT "IssueCommentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueCommentAttachment_commentId_idx" ON "IssueCommentAttachment"("commentId");

-- CreateIndex
CREATE INDEX "IssueAttachment_historyId_idx" ON "IssueAttachment"("historyId");

-- CreateIndex
CREATE INDEX "IssueAttachment_uploaderId_idx" ON "IssueAttachment"("uploaderId");

-- CreateIndex
CREATE INDEX "IssueComment_historyId_idx" ON "IssueComment"("historyId");

-- AddForeignKey
ALTER TABLE "IssueHistory" ADD CONSTRAINT "IssueHistory_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "IssueHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueAttachment" ADD CONSTRAINT "IssueAttachment_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "IssueHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueAttachment" ADD CONSTRAINT "IssueAttachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueCommentAttachment" ADD CONSTRAINT "IssueCommentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "IssueComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
