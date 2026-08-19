/*
  Warnings:

  - You are about to drop the column `QuoteAmount` on the `Bids` table. All the data in the column will be lost.
  - Added the required column `Message` to the `Bids` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ProposedPrice` to the `Bids` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bids" DROP COLUMN "QuoteAmount",
ADD COLUMN     "CounterAmount" DECIMAL(65,30),
ADD COLUMN     "Message" TEXT NOT NULL,
ADD COLUMN     "ProposedPrice" DECIMAL(65,30) NOT NULL;
