-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('issued', 'replacement', 'cancelled');

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN "status" "ReceiptStatus" NOT NULL DEFAULT 'issued';
ALTER TABLE "Receipt" ADD COLUMN "replacesReceiptId" TEXT;

-- CreateTable
CREATE TABLE "ReceiptDonation" (
    "receiptId" TEXT NOT NULL,
    "incomeId" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptDonation_pkey" PRIMARY KEY ("receiptId","incomeId")
);

-- CreateIndex
CREATE INDEX "Receipt_replacesReceiptId_idx" ON "Receipt"("replacesReceiptId");

-- CreateIndex
CREATE INDEX "ReceiptDonation_incomeId_idx" ON "ReceiptDonation"("incomeId");

-- CreateIndex
CREATE INDEX "ReceiptDonation_receivedDate_idx" ON "ReceiptDonation"("receivedDate");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_replacesReceiptId_fkey" FOREIGN KEY ("replacesReceiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDonation" ADD CONSTRAINT "ReceiptDonation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDonation" ADD CONSTRAINT "ReceiptDonation_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES "Income"("inc_id") ON DELETE RESTRICT ON UPDATE CASCADE;
