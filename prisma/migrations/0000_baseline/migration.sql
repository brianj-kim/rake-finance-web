-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Category" (
    "ctg_id" SERIAL NOT NULL,
    "isParent" BOOLEAN,
    "depth" CHAR(3),
    "range" CHAR(3),
    "name" VARCHAR(20) NOT NULL,
    "detail" VARCHAR(255),
    "order" SMALLINT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("ctg_id")
);

-- CreateTable
CREATE TABLE "Income" (
    "inc_id" SERIAL NOT NULL,
    "inc_type" INTEGER,
    "amount" INTEGER,
    "member" INTEGER,
    "year" SMALLINT,
    "month" SMALLINT,
    "day" SMALLINT,
    "qt" SMALLINT,
    "notes" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "inc_method" INTEGER,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("inc_id")
);

-- CreateTable
CREATE TABLE "Member" (
    "mbr_id" SERIAL NOT NULL,
    "name_kFull" VARCHAR(50) NOT NULL,
    "name_eFirst" VARCHAR(30),
    "name_eLast" VARCHAR(30),
    "email" VARCHAR(80),
    "address" VARCHAR(50),
    "city" VARCHAR(20),
    "province" VARCHAR(20),
    "postal" VARCHAR(7),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "name_detail" VARCHAR(255),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("mbr_id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "memberId" INTEGER NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serialNumber" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "pdfUrl" TEXT NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Income_month_idx" ON "Income"("month");

-- CreateIndex
CREATE INDEX "Income_qt_idx" ON "Income"("qt");

-- CreateIndex
CREATE INDEX "Income_year_idx" ON "Income"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Member_name_kFull_key" ON "Member"("name_kFull");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_inc_method_fkey" FOREIGN KEY ("inc_method") REFERENCES "Category"("ctg_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_inc_type_fkey" FOREIGN KEY ("inc_type") REFERENCES "Category"("ctg_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_member_fkey" FOREIGN KEY ("member") REFERENCES "Member"("mbr_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

