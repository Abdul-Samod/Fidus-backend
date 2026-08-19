-- CreateTable
CREATE TABLE "KycSubmission" (
    "id" UUID NOT NULL,
    "userUuid" UUID NOT NULL,
    "ninUrl" TEXT,
    "profilePicUrl" TEXT,
    "businessCert" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KycSubmission_userUuid_key" ON "KycSubmission"("userUuid");

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "Users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
