-- CreateTable
CREATE TABLE "Users" (
    "uuid" UUID NOT NULL,
    "FullName" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Role" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "KYC_Verified" BOOLEAN NOT NULL DEFAULT false,
    "WTA_Score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Service_Requests" (
    "RequestID" UUID NOT NULL,
    "ClientID" UUID NOT NULL,
    "Description" TEXT NOT NULL,
    "LocationCoordinates" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Open',

    CONSTRAINT "Service_Requests_pkey" PRIMARY KEY ("RequestID")
);

-- CreateTable
CREATE TABLE "Bids" (
    "BidID" UUID NOT NULL,
    "RequestID" UUID NOT NULL,
    "ArtisanID" UUID NOT NULL,
    "QuoteAmount" DOUBLE PRECISION NOT NULL,
    "BidStatus" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Bids_pkey" PRIMARY KEY ("BidID")
);

-- CreateTable
CREATE TABLE "Escrow_Transactions" (
    "TransactionID" UUID NOT NULL,
    "RequestID" UUID NOT NULL,
    "AmountHeld" DOUBLE PRECISION NOT NULL,
    "EscrowStatus" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Escrow_Transactions_pkey" PRIMARY KEY ("TransactionID")
);

-- CreateTable
CREATE TABLE "Reviews" (
    "ReviewID" UUID NOT NULL,
    "RequestID" UUID NOT NULL,
    "ReviewerID" UUID NOT NULL,
    "RevieweeID" UUID NOT NULL,
    "WTA_Weight" INTEGER NOT NULL,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("ReviewID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_Email_key" ON "Users"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_Transactions_RequestID_key" ON "Escrow_Transactions"("RequestID");

-- AddForeignKey
ALTER TABLE "Service_Requests" ADD CONSTRAINT "Service_Requests_ClientID_fkey" FOREIGN KEY ("ClientID") REFERENCES "Users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bids" ADD CONSTRAINT "Bids_RequestID_fkey" FOREIGN KEY ("RequestID") REFERENCES "Service_Requests"("RequestID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bids" ADD CONSTRAINT "Bids_ArtisanID_fkey" FOREIGN KEY ("ArtisanID") REFERENCES "Users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow_Transactions" ADD CONSTRAINT "Escrow_Transactions_RequestID_fkey" FOREIGN KEY ("RequestID") REFERENCES "Service_Requests"("RequestID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_RequestID_fkey" FOREIGN KEY ("RequestID") REFERENCES "Service_Requests"("RequestID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_ReviewerID_fkey" FOREIGN KEY ("ReviewerID") REFERENCES "Users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_RevieweeID_fkey" FOREIGN KEY ("RevieweeID") REFERENCES "Users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
