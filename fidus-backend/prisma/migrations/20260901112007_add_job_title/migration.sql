/*
  Warnings:

  - The `BidStatus` column on the `Bids` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `EscrowStatus` column on the `Escrow_Transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `Status` column on the `Service_Requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `UpdatedAt` to the `Bids` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UpdatedAt` to the `Escrow_Transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UpdatedAt` to the `Reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UpdatedAt` to the `Service_Requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UpdatedAt` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `Role` on the `Users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Client', 'Artisan');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('Open', 'Assigned', 'Completed');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('Pending', 'Counter_Offered', 'Accepted', 'Rejected');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('Pending', 'Funded', 'Released', 'Disputed');

-- AlterTable
ALTER TABLE "Bids" ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "BidStatus",
ADD COLUMN     "BidStatus" "BidStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "Escrow_Transactions" ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "EscrowStatus",
ADD COLUMN     "EscrowStatus" "EscrowStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "KycSubmission" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Reviews" ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Service_Requests" ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "Title" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "Status",
ADD COLUMN     "Status" "ServiceStatus" NOT NULL DEFAULT 'Open';

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "Role",
ADD COLUMN     "Role" "Role" NOT NULL;
