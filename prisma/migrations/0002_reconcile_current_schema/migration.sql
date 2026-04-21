-- Reconcile objects that existed in production but were missing from
-- prisma/migrations/0000_baseline. This migration is intentionally
-- idempotent so it can run against both production and a clean DB.

DO $$
BEGIN
  CREATE TYPE "AdminRole" AS ENUM ('super', 'treasurer', 'pastor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ReceiptStatus" AS ENUM ('issued', 'replacement', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Admin" (
  "id" SERIAL NOT NULL,
  "email" VARCHAR(120) NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "name" VARCHAR(80),
  "role" "AdminRole" NOT NULL DEFAULT 'treasurer',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "email" VARCHAR(120);
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR(255);
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "name" VARCHAR(80);
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "role" "AdminRole" DEFAULT 'treasurer';

UPDATE "Admin" SET "isActive" = true WHERE "isActive" IS NULL;
UPDATE "Admin" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
UPDATE "Admin" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

DO $$
DECLARE
  role_udt TEXT;
BEGIN
  ALTER TABLE "Admin" ALTER COLUMN "role" DROP DEFAULT;

  UPDATE "Admin"
  SET "role" = 'treasurer'
  WHERE "role" IS NULL
     OR "role"::TEXT NOT IN ('super', 'treasurer', 'pastor');

  SELECT "udt_name"
  INTO role_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Admin'
    AND column_name = 'role';

  IF role_udt IS DISTINCT FROM 'AdminRole' THEN
    ALTER TABLE "Admin"
      ALTER COLUMN "role" TYPE "AdminRole"
      USING ("role"::TEXT::"AdminRole");
  END IF;

  ALTER TABLE "Admin" ALTER COLUMN "role" SET DEFAULT 'treasurer';
  ALTER TABLE "Admin" ALTER COLUMN "role" SET NOT NULL;
END $$;

ALTER TABLE "Admin" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "Admin" ALTER COLUMN "passwordHash" SET NOT NULL;
ALTER TABLE "Admin" ALTER COLUMN "isActive" SET DEFAULT true;
ALTER TABLE "Admin" ALTER COLUMN "isActive" SET NOT NULL;
ALTER TABLE "Admin" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Admin" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Admin" ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "Role" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "code" VARCHAR(50);
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "name" VARCHAR(100);
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN DEFAULT true;
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "Role" SET "isSystem" = true WHERE "isSystem" IS NULL;
UPDATE "Role" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
UPDATE "Role" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "Role" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Role" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Role" ALTER COLUMN "isSystem" SET DEFAULT true;
ALTER TABLE "Role" ALTER COLUMN "isSystem" SET NOT NULL;
ALTER TABLE "Role" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Role" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Role" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Role" ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "Permission" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "code" VARCHAR(80);
ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "name" VARCHAR(120);
ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Permission" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "Permission" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
UPDATE "Permission" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "Permission" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Permission" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Permission" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Permission" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Permission" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Permission" ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "roleId" INTEGER NOT NULL,
  "permissionId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

ALTER TABLE "RolePermission" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
UPDATE "RolePermission" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
ALTER TABLE "RolePermission" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "RolePermission" ALTER COLUMN "createdAt" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "AdminRoleAssignment" (
  "adminId" INTEGER NOT NULL,
  "roleId" INTEGER NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminRoleAssignment_pkey" PRIMARY KEY ("adminId", "roleId")
);

ALTER TABLE "AdminRoleAssignment" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
UPDATE "AdminRoleAssignment" SET "assignedAt" = CURRENT_TIMESTAMP WHERE "assignedAt" IS NULL;
ALTER TABLE "AdminRoleAssignment" ALTER COLUMN "assignedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AdminRoleAssignment" ALTER COLUMN "assignedAt" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "CharityProfile" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "legalName" VARCHAR(120) NOT NULL,
  "address" VARCHAR(120) NOT NULL,
  "city" VARCHAR(40) NOT NULL,
  "province" VARCHAR(20) NOT NULL,
  "postal" VARCHAR(7) NOT NULL,
  "registrationNo" VARCHAR(20) NOT NULL,
  "locationIssued" VARCHAR(60) NOT NULL,
  "authorizedSigner" VARCHAR(80) NOT NULL,
  "charityEmail" VARCHAR(80),
  "charityPhone" VARCHAR(20),
  "charityWebsite" VARCHAR(120),
  "churchLogoUrl" VARCHAR(255),
  "authorizedSignature" VARCHAR(255),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CharityProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CharityProfile" ADD COLUMN IF NOT EXISTS "charityEmail" VARCHAR(80);
ALTER TABLE "CharityProfile" ADD COLUMN IF NOT EXISTS "charityPhone" VARCHAR(20);
ALTER TABLE "CharityProfile" ADD COLUMN IF NOT EXISTS "charityWebsite" VARCHAR(120);
ALTER TABLE "CharityProfile" ADD COLUMN IF NOT EXISTS "churchLogoUrl" VARCHAR(255);
ALTER TABLE "CharityProfile" ADD COLUMN IF NOT EXISTS "authorizedSignature" VARCHAR(255);
ALTER TABLE "CharityProfile" ALTER COLUMN "id" SET DEFAULT 1;

ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "note" VARCHAR(255);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Member'
      AND column_name = 'name_detail'
  ) THEN
    UPDATE "Member"
    SET "note" = "name_detail"
    WHERE "note" IS NULL;

    ALTER TABLE "Member" DROP COLUMN "name_detail";
  END IF;
END $$;

ALTER TABLE "Receipt" ALTER COLUMN "pdfUrl" DROP NOT NULL;
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "status" "ReceiptStatus" NOT NULL DEFAULT 'issued';
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "replacesReceiptId" TEXT;
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "eligibleCents" INTEGER;
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "advantageCents" INTEGER DEFAULT 0;
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "donorName" VARCHAR(80);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "donorAddress" VARCHAR(120);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "donorCity" VARCHAR(40);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "donorProvince" VARCHAR(20);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "donorPostal" VARCHAR(7);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "charityName" VARCHAR(120);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "charityAddress" VARCHAR(120);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "charityCity" VARCHAR(40);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "charityProvince" VARCHAR(20);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "charityPostal" VARCHAR(7);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "charityRegNo" VARCHAR(20);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "charityEmail" VARCHAR(80);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "charityPhone" VARCHAR(20);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "charityWebsite" VARCHAR(120);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "churchLogoUrl" VARCHAR(255);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "locationIssued" VARCHAR(60);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "authorizedSigner" VARCHAR(80);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "authorizedSignatureUrl" VARCHAR(255);

UPDATE "Receipt"
SET
  "status" = COALESCE("status", 'issued'),
  "eligibleCents" = COALESCE("eligibleCents", "totalCents"),
  "advantageCents" = COALESCE("advantageCents", 0);

UPDATE "Receipt" r
SET
  "donorName" = COALESCE(
    r."donorName",
    LEFT(COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', m."name_eFirst", m."name_eLast")), ''), m."name_kFull", '-'), 80)
  ),
  "donorAddress" = COALESCE(r."donorAddress", LEFT(m."address", 120)),
  "donorCity" = COALESCE(r."donorCity", LEFT(m."city", 40)),
  "donorProvince" = COALESCE(r."donorProvince", LEFT(m."province", 20)),
  "donorPostal" = COALESCE(r."donorPostal", LEFT(m."postal", 7))
FROM "Member" m
WHERE m."mbr_id" = r."memberId";

UPDATE "Receipt" r
SET
  "charityName" = COALESCE(r."charityName", LEFT(c."legalName", 120)),
  "charityAddress" = COALESCE(r."charityAddress", LEFT(c."address", 120)),
  "charityCity" = COALESCE(r."charityCity", LEFT(c."city", 40)),
  "charityProvince" = COALESCE(r."charityProvince", LEFT(c."province", 20)),
  "charityPostal" = COALESCE(r."charityPostal", LEFT(c."postal", 7)),
  "charityRegNo" = COALESCE(r."charityRegNo", LEFT(c."registrationNo", 20)),
  "charityEmail" = COALESCE(r."charityEmail", LEFT(c."charityEmail", 80)),
  "charityPhone" = COALESCE(r."charityPhone", LEFT(c."charityPhone", 20)),
  "charityWebsite" = COALESCE(r."charityWebsite", LEFT(c."charityWebsite", 120)),
  "churchLogoUrl" = COALESCE(r."churchLogoUrl", LEFT(c."churchLogoUrl", 255)),
  "locationIssued" = COALESCE(r."locationIssued", LEFT(c."locationIssued", 60)),
  "authorizedSigner" = COALESCE(r."authorizedSigner", LEFT(c."authorizedSigner", 80)),
  "authorizedSignatureUrl" = COALESCE(r."authorizedSignatureUrl", LEFT(c."authorizedSignature", 255))
FROM "CharityProfile" c
WHERE c."id" = 1;

UPDATE "Receipt"
SET
  "donorName" = COALESCE("donorName", '-'),
  "charityName" = COALESCE("charityName", '-'),
  "charityAddress" = COALESCE("charityAddress", '-'),
  "charityCity" = COALESCE("charityCity", '-'),
  "charityProvince" = COALESCE("charityProvince", '-'),
  "charityPostal" = COALESCE("charityPostal", '-'),
  "charityRegNo" = COALESCE("charityRegNo", '-'),
  "locationIssued" = COALESCE("locationIssued", '-'),
  "authorizedSigner" = COALESCE("authorizedSigner", '-');

ALTER TABLE "Receipt" ALTER COLUMN "status" SET DEFAULT 'issued';
ALTER TABLE "Receipt" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "eligibleCents" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "advantageCents" SET DEFAULT 0;
ALTER TABLE "Receipt" ALTER COLUMN "advantageCents" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "donorName" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "charityName" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "charityAddress" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "charityCity" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "charityProvince" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "charityPostal" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "charityRegNo" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "locationIssued" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "authorizedSigner" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "ReceiptDonation" (
  "receiptId" TEXT NOT NULL,
  "incomeId" INTEGER NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "receivedDate" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReceiptDonation_pkey" PRIMARY KEY ("receiptId", "incomeId")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "Admin"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Role_code_key" ON "Role"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code");
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE INDEX IF NOT EXISTS "AdminRoleAssignment_roleId_idx" ON "AdminRoleAssignment"("roleId");
CREATE INDEX IF NOT EXISTS "Receipt_memberId_taxYear_idx" ON "Receipt"("memberId", "taxYear");
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_taxYear_serialNumber_key" ON "Receipt"("taxYear", "serialNumber");
CREATE INDEX IF NOT EXISTS "Receipt_replacesReceiptId_idx" ON "Receipt"("replacesReceiptId");
CREATE INDEX IF NOT EXISTS "ReceiptDonation_incomeId_idx" ON "ReceiptDonation"("incomeId");
CREATE INDEX IF NOT EXISTS "ReceiptDonation_receivedDate_idx" ON "ReceiptDonation"("receivedDate");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"RolePermission"'::regclass
      AND conname = 'RolePermission_roleId_fkey'
  ) THEN
    ALTER TABLE "RolePermission"
      ADD CONSTRAINT "RolePermission_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "Role"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"RolePermission"'::regclass
      AND conname = 'RolePermission_permissionId_fkey'
  ) THEN
    ALTER TABLE "RolePermission"
      ADD CONSTRAINT "RolePermission_permissionId_fkey"
      FOREIGN KEY ("permissionId") REFERENCES "Permission"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"AdminRoleAssignment"'::regclass
      AND conname = 'AdminRoleAssignment_adminId_fkey'
  ) THEN
    ALTER TABLE "AdminRoleAssignment"
      ADD CONSTRAINT "AdminRoleAssignment_adminId_fkey"
      FOREIGN KEY ("adminId") REFERENCES "Admin"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"AdminRoleAssignment"'::regclass
      AND conname = 'AdminRoleAssignment_roleId_fkey'
  ) THEN
    ALTER TABLE "AdminRoleAssignment"
      ADD CONSTRAINT "AdminRoleAssignment_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "Role"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"Receipt"'::regclass
      AND conname = 'Receipt_memberId_fkey'
  ) THEN
    ALTER TABLE "Receipt"
      ADD CONSTRAINT "Receipt_memberId_fkey"
      FOREIGN KEY ("memberId") REFERENCES "Member"("mbr_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"Receipt"'::regclass
      AND conname = 'Receipt_replacesReceiptId_fkey'
  ) THEN
    ALTER TABLE "Receipt"
      ADD CONSTRAINT "Receipt_replacesReceiptId_fkey"
      FOREIGN KEY ("replacesReceiptId") REFERENCES "Receipt"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"ReceiptDonation"'::regclass
      AND conname = 'ReceiptDonation_receiptId_fkey'
  ) THEN
    ALTER TABLE "ReceiptDonation"
      ADD CONSTRAINT "ReceiptDonation_receiptId_fkey"
      FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"ReceiptDonation"'::regclass
      AND conname = 'ReceiptDonation_incomeId_fkey'
  ) THEN
    ALTER TABLE "ReceiptDonation"
      ADD CONSTRAINT "ReceiptDonation_incomeId_fkey"
      FOREIGN KEY ("incomeId") REFERENCES "Income"("inc_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE VIEW "IncomeList" AS
SELECT
  i."inc_id",
  i."amount",
  i."notes",
  i."year",
  i."month",
  i."day",
  ct_type."name" AS "type",
  m."name_kFull" AS "name",
  i."qt",
  i."created_at",
  ct_method."name" AS "method"
FROM "Income" i
LEFT JOIN "Category" ct_type ON i."inc_type" = ct_type."ctg_id"
LEFT JOIN "Category" ct_method ON i."inc_method" = ct_method."ctg_id"
LEFT JOIN "Member" m ON m."mbr_id" = i."member";
