/*
  Warnings:

  - You are about to drop the column `RevieweeID` on the `Reviews` table. All the data in the column will be lost.
  - You are about to drop the column `ReviewerID` on the `Reviews` table. All the data in the column will be lost.
  - You are about to drop the column `WTA_Weight` on the `Reviews` table. All the data in the column will be lost.
  - Added the required column `ArtisanID` to the `Reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ClientID` to the `Reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Rating` to the `Reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Reviews" DROP CONSTRAINT "Reviews_RevieweeID_fkey";

-- DropForeignKey
ALTER TABLE "Reviews" DROP CONSTRAINT "Reviews_ReviewerID_fkey";

-- AlterTable
ALTER TABLE "Reviews" DROP COLUMN "RevieweeID",
DROP COLUMN "ReviewerID",
DROP COLUMN "WTA_Weight",
ADD COLUMN     "ArtisanID" UUID NOT NULL,
ADD COLUMN     "ClientID" UUID NOT NULL,
ADD COLUMN     "Comment" TEXT,
ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "Rating" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_ClientID_fkey" FOREIGN KEY ("ClientID") REFERENCES "Users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_ArtisanID_fkey" FOREIGN KEY ("ArtisanID") REFERENCES "Users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
