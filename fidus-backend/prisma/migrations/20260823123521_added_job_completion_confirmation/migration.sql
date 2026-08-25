-- AlterTable
ALTER TABLE "Service_Requests" ADD COLUMN     "ArtisanCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ClientCompleted" BOOLEAN NOT NULL DEFAULT false;
