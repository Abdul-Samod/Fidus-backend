/*
  Warnings:

  - You are about to alter the column `AmountHeld` on the `Escrow_Transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Escrow_Transactions" ALTER COLUMN "AmountHeld" SET DATA TYPE DECIMAL(65,30);
