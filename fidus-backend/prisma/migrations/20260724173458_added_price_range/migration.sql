/*
  Warnings:

  - Added the required column `PriceRange` to the `Service_Requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Service_Requests" ADD COLUMN     "PriceRange" TEXT NOT NULL;
