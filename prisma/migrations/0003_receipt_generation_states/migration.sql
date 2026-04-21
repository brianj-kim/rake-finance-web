-- Track receipt generation reservations separately from completed receipts.
ALTER TYPE "ReceiptStatus" ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE "ReceiptStatus" ADD VALUE IF NOT EXISTS 'failed';
