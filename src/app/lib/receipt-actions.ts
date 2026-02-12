'use server';

import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { revalidatePath } from 'next/cache';

import { createElement } from 'react';

import ReceiptDocument, { ReceiptDocumentProps } from '@/app/ui/receipt/receipt-document';
import { formatEnglishName, truncate } from '@/app/lib/utils';
import { bufferFromReactPdf } from '@/app/lib/receipt-buffer-from-reactPDF';
import type { ActionFail, ActionOK, ActionResult } from '@/app/lib/definitions';

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const isUniqueViolation = (err: unknown) => 
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

export const generateReceiptForSelected = async (input: {
  memberId: number;
  taxYear: number;
  incomeIds: number[];
}): Promise<ActionResult<{ receiptId: string; serialNumber: number; pdfUrl: string }>> => {
  const memberId = Number(input.memberId);
  const taxYear = Number(input.taxYear);

  const incomeIds = Array.from(new Set((input.incomeIds ?? []).map(Number))).filter(
    (n) => Number.isInteger(n) && n > 0
  );

  if (!Number.isInteger(memberId) || memberId <= 0) return { success: false, message: 'Invalid memberId' };
  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) return { success: false, message: 'Invalid tax year' };
  if (incomeIds.length === 0) return { success: false, message: 'No donations selected.' };

  const [member, charity] = await Promise.all([
    prisma.member.findUnique({
      where: { mbr_id: memberId },
      select: {
        mbr_id: true,
        name_kFull: true,
        name_eFirst: true,
        name_eLast: true,
        address: true,
        city: true,
        province: true,
        postal: true,
      },
    }),
    prisma.charityProfile.findUnique({ where: { id: 1 } }),
  ]);

  if (!member) return { success: false, message: 'Member not found.'};
  if (!charity) return { success: false, message: 'Charity profile is not set up yet.' };

  const donations = await prisma.income.findMany({
    where: {
      inc_id: { in: incomeIds },
      member: memberId,
      year: taxYear,
      amount: { gt: 0 },
    },
    select: { inc_id: true, month: true, day: true, amount: true },
    orderBy: [{ month: 'asc' }, { day: 'asc' }, { inc_id: 'asc' }],
  });

  if (donations.length === 0) return { success: false, message: 'Selected donations not found.' };

  const lines = donations.map((d) => ({
    date: `${taxYear}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`,
    amountCents: Number(d.amount) || 0,
  }));

  const totalCents = lines.reduce((acc, r) => acc + r.amountCents, 0);
  if (totalCents <= 0) return { success: false, message: 'Selected donations total is 0' };

  const donorName = truncate(formatEnglishName(member.name_eFirst, member.name_eLast) ?? member.name_kFull, 80) ?? '-';
  const donorAddress = truncate(member.address, 120);
  const donorCity = truncate(member.city, 40);
  const donorProvince = truncate(member.province, 20);
  const donorPostal = truncate(member.postal, 7);

  const charityName = truncate(charity.legalName, 120) ?? '-';
  const charityAddress = truncate(charity.address, 120) ?? '-';
  const charityCity = truncate(charity.city, 40) ?? '-';
  const charityProvince = truncate(charity.province, 20) ?? '-';
  const charityPostal = truncate(charity.postal, 7) ?? '-';
  const charityRegNo = truncate(charity.registrationNo, 20) ?? '-';
  const locationIssued = truncate(charity.locationIssued, 60) ?? '-';
  const authorizedSigner = truncate(charity.authorizedSigner, 80) ?? '-';

  const issueDate = new Date();
  const issueDateISO = toISODate(issueDate);

  const MAX_RETRIES = 3;

  for (let attempt =1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const agg = await tx.receipt.aggregate({
          where: { taxYear },
          _max: { serialNumber: true },
        });

        const nextSerial = (agg._max.serialNumber ?? 0) + 1;

        const docProps: ReceiptDocumentProps = {
          taxYear,
          serialNumber: nextSerial,
          issueDateISO,
          charity: {
            legalName: charityName,
            registrationNo: charityRegNo,
            address: charityAddress,
            city: charityCity,
            province: charityProvince,
            postal: charityPostal,
            locationIssued,
            authorizedSigner,
          },
          donor: {
            name_official: donorName,
            address: donorAddress,
            city: donorCity,
            province: donorProvince,
            postal: donorPostal,
          },
          totalCents,
          lines,
        };

        const doc = createElement(ReceiptDocument, docProps);
        const pdfBuffer = await bufferFromReactPdf(doc);

        const dir = path.join(process.cwd(), 'public', 'receipts', String(taxYear));
        await fs.mkdir(dir, { recursive: true });

        const fileName = `receipt-${taxYear}-${String(nextSerial).padStart(5, '0')}.pdf`;
        const filePath = path.join(dir, fileName);

        const receipt = await tx.receipt.create({
          data: {
            memberId,
            taxYear,
            issueDate,
            serialNumber: nextSerial,
            totalCents,
            eligibleCents: totalCents,
            advantageCents: 0,

            donorName,
            donorAddress,
            donorCity,
            donorProvince,
            donorPostal,

            charityName,
            charityAddress,
            charityCity,
            charityProvince,
            charityPostal,
            charityRegNo,
            locationIssued,
            authorizedSigner,

            pdfUrl: null,
          },
          select: { id: true },
        });

        await fs.writeFile(filePath, pdfBuffer);

        const pdfUrl = `/receipts/${taxYear}/${fileName}`;

        await tx.receipt.update({
          where: { id: receipt.id },
          data: { pdfUrl },
        });

        return { receiptId: receipt.id, serialNumber: nextSerial, pdfUrl };
      });

      return { success: true, ...created };
    } catch (err) {
      if (isUniqueViolation(err) && attempt < MAX_RETRIES) continue;
      console.error('generateReceiptForSelected error:', err);
      return { success: false, message: 'Failed to generate receipt. Please try again.' };      
    } 
  }

  return { success: false, message: 'Failed due to serial-number conflicts. Please try again.'};
};

// Receipt Manage Page Actions
export type DeleteReceiptResult = ActionOK | ActionFail;

const safePublicFilePathFromUrl = (pdfUrl: string | null | undefined) => {
  if (!pdfUrl || typeof pdfUrl !== 'string') return null;
  if (!pdfUrl.startsWith('/receipts/')) return null;

  const publicDir = path.join(process.cwd(), 'public');
  const relative = pdfUrl.replace(/^\/+/,''); //remove leading '/'
  const full = path.normalize(path.join(publicDir, relative));

  if (!full.startsWith(publicDir + path.sep) && full !== publicDir) return null;
  return full;
};

export const deleteReceiptAndFile = async (input: {
  receiptId: string;
}): Promise<DeleteReceiptResult> => {
  const receiptId = String(input.receiptId || '').trim();
  if (!receiptId) return { success: false, message: 'Invalid receiptId'};

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      select: { id: true, pdfUrl: true, memberId: true, taxYear: true },
    });

    if (!receipt) return { success: false, message: 'Receipt not found.' };

    const filePath = safePublicFilePathFromUrl(receipt.pdfUrl);

    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (err: any) {
        if (err?.code !== 'ENOENT') {
          console.error('unlink failed:', err);
          return { success: false, message: 'Failed to delete PDF file.' };
        }
      }
    }

    await prisma.receipt.delete({ where: { id: receiptId } });

    revalidatePath('/income/receipt/manage');
    revalidatePath(`/income/receipt/${receipt.memberId}/receipts`);

    return { success: true };
  } catch (err) {
    console.error('deleteReceiptAndFile error:', err);
    return { success: false, message: 'Failed to delete receipt.' };
  }
}

// Receipt Bulk Actions
type ReceiptBulkGenOK<T extends object = {}> = { success: true } & T;
type ReceiptBulkGenFail = { success: false; message: string };
export type ReceiptBulkGenerationResult<T extends object = {}> = ReceiptBulkGenOK | ReceiptBulkGenFail;

const isInt = (v: unknown): v is number => Number.isInteger(v);
const buildLines = (taxYear: number, donations: Array<{ month: number | null; day: number | null; amount: number | null }>) => {
  return donations
    .filter((d) => isInt(d.month) && isInt(d.day) && isInt(d.amount) && (d.amount ?? 0) > 0)
    .map((d) => ({
      date: `${taxYear}-${String(d.month!).padStart(2, '0')}-${String(d.day!).padStart(2, '0')}`,
      amountCents: d.amount as number,
    }));
};

const generateOneMemberReceipt = async (input: {
  memberId: number;
  taxYear: number;
  charity: {
    legalName: string;
    address: string;
    city: string;
    province: string;
    postal: string;
    registrationNo: string;
    locationIssued: string;
    authorizedSigner: string;
  };
}): Promise<ReceiptBulkGenerationResult<{ receiptId: string; serialNumber: number; pdfUrl: string }>> => {
  const { memberId, taxYear, charity } = input;

  const member = await prisma.member.findUnique({
    where: { mbr_id: memberId }, 
    select: {
      mbr_id: true,
      name_kFull: true,
      name_eFirst: true,
      name_eLast: true,
      address: true,
      city: true,
      province: true,
      postal: true,
    },
  });

  if (!member) return { success: false, message: `Member not found: ${memberId}` };

  const donations = await prisma.income.findMany({
    where: {
      member: memberId,
      year: taxYear,
      amount: { gt: 0 },
    },
    select: { month: true, day: true, amount: true, inc_id: true },
    orderBy: [{ month: 'asc' }, { day: 'asc' }, { inc_id: 'asc' }],
  });

  const lines = buildLines(taxYear, donations);
  const totalCents = lines.reduce((acc, r) => acc + r.amountCents, 0);
  if (totalCents <= 0) return { success: false, message: `No valid donations: ${memberId}` };

  const donorName = 
    truncate(formatEnglishName(member.name_eFirst, member.name_eLast) ?? member.name_kFull, 80) ?? '-';
  
  const donorAddress = truncate(member.address, 50);
  const donorCity = truncate(member.city, 20);
  const donorProvince = truncate(member.province, 20);
  const donorPostal = truncate(member.postal, 7);

  const charityName = truncate(charity.legalName, 120) ?? '-';
  const charityAddress = truncate(charity.address, 120) ?? '-';
  const charityCity = truncate(charity.city, 40) ?? '-';
  const charityProvince = truncate(charity.province, 20) ?? '-';
  const charityPostal = truncate(charity.postal, 7) ?? '-';
  const charityRegNo = truncate(charity.registrationNo, 20) ?? '-';
  const locationIssued = truncate(charity.locationIssued, 60) ?? '-';
  const authorizedSigner = truncate(charity.authorizedSigner, 80) ?? '-';

  const issueDate = new Date();
  const issueDateISO = toISODate(issueDate);

  const MAX_RETRIES = 3;

  for (let attempt =1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const agg = await tx.receipt.aggregate({
          where: { taxYear },
          _max: { serialNumber: true },
        });

        const nextSerial = (agg._max.serialNumber ?? 0) + 1;

        const docProps: ReceiptDocumentProps = {
          taxYear,
          serialNumber: nextSerial,
          issueDateISO,
          charity: {
            legalName: charityName,
            registrationNo: charityRegNo,
            address: charityAddress,
            city: charityCity,
            province: charityProvince,
            postal: charityPostal,
            locationIssued,
            authorizedSigner,
          },
          donor: {
            name_official: donorName,
            address: donorAddress,
            city: donorCity,
            province: donorProvince,
            postal: donorPostal
          },
          totalCents,
          lines,
        };

        const doc = createElement(ReceiptDocument, docProps);
        const pdfBuffer = await bufferFromReactPdf(doc);

        const dir = path.join(process.cwd(), 'public', 'receipts', String(taxYear));
        await fs.mkdir(dir, { recursive: true });

        const fileName = `receipt-${taxYear}-${String(nextSerial).padStart(5, '0')}.pdf`;
        const filePath = path.join(dir, fileName);
        await fs.writeFile(filePath, pdfBuffer);

        const pdfUrl = `/receipts/${taxYear}/${fileName}`;

        const receipt = await tx.receipt.create({
          data: {
            memberId,
            taxYear,
            issueDate,
            serialNumber: nextSerial,

            totalCents,
            eligibleCents: totalCents,
            advantageCents: 0,

            donorName,
            donorAddress,
            donorCity,
            donorProvince,
            donorPostal,

            charityName,
            charityAddress,
            charityCity,
            charityProvince,
            charityPostal,
            charityRegNo,
            locationIssued,
            authorizedSigner,

            pdfUrl,
          },
          select: { id: true },
        });

        return { receiptId: receipt.id, serialNumber: nextSerial, pdfUrl };
      });

      return { success: true, ...created };
    } catch (err) {
      if (isUniqueViolation(err) && attempt < MAX_RETRIES) continue;
      console.error('generateOneMemberReceipt error:', err);
      return { success: false, message: `Failed to generate for memberId=${memberId}` };      
    }
  }

  return { success: false, message: `Serial conflicts for memberId=${memberId}` };
}

export const generateReceiptsForYearBatch = async (input: {
  taxYear: number;
  cursor?: number; // How many eligible members already processed
  batchSize?: number; // Default 20
}): Promise<
  ActionResult<{
    taxYear: number;
    cursor: number;
    nextCursor: number | null;
    created: number;
    skipped: number;
    failed: number;
    failures: Array<{ memberId: number; message: string }>;
  }>
> => {
  const taxYear = Number(input.taxYear);
  const cursor = Math.max(0, Number(input.cursor ?? 0) || 0);
  const batchSize = Math.min(50, Math.max(1, Number(input.batchSize ?? 20) || 20));

  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) {
    return { success: false, message: 'Invalid taxYear' };
  }

  const charity = await prisma.charityProfile.findUnique({ where: { id: 1 } });
  if (!charity) return { success: false, message: 'Charity profile is not set up yet.' };

  const eligible = await prisma.income.groupBy({
    by: ['member'],
    where: { year: taxYear, amount: { gt: 0 }, member: { not: null } },
    orderBy: { member: 'asc' },
    skip: cursor,
    take: batchSize,
  });

  const memberIds = eligible
    .map((r) => r.member)
    .filter((v): v is number => Number.isInteger(v));

  if (memberIds.length === 0) {
    return {
      success: true,
      taxYear,
      cursor,
      nextCursor: null,
      created: 0,
      skipped: 0,
      failed: 0,
      failures: [],
    };
  }

  const existing = await prisma.receipt.findMany({
    where: { taxYear, memberId: { in: memberIds } },
    select: { memberId: true },
  });

  const existingSet = new Set(existing.map((r) => r.memberId));

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const failures: Array<{ memberId: number; message: string }> = [];

  for (const memberId of memberIds) {
    if (existingSet.has(memberId)) {
      skipped++;
      continue;
    }

    const res = await generateOneMemberReceipt({
      memberId,
      taxYear,
      charity: {
        legalName: charity.legalName,
        address: charity.address,
        city: charity.city,
        province: charity.province,
        postal: charity.postal,
        registrationNo: charity.registrationNo,
        locationIssued: charity.locationIssued,
        authorizedSigner: charity.authorizedSigner,
      },
    });

    if (res.success) created++;
    else {
      failed++;
      failures.push({ memberId, message: res.message });
    }
  }

  const nextCursor = memberIds.length === batchSize ? cursor + batchSize : null;

  return {
    success: true,
    taxYear,
    cursor,
    nextCursor,
    created,
    skipped,
    failed,
    failures,
  };
}

// Bulk delete for receipts
export const deleteReceiptsAndFiles = async (input: {
  receiptIds: string[];
}): Promise<ActionResult<{ deleted: number }>> => {
  const receiptIds = Array.from(
    new Set((input.receiptIds ?? []).map((s) => String(s).trim()))
  ).filter(Boolean);

  if (receiptIds.length === 0) {
    return { success: false, message: 'No receipts selected.' };
  }

  try {
    const receipts = await prisma.receipt.findMany({
      where: { id: { in: receiptIds } },
      select: { id: true, pdfUrl: true },
    });


    for (const r of receipts) {
      const filePath = safePublicFilePathFromUrl(r.pdfUrl);
      if (!filePath) continue;

      try {
        await fs.unlink(filePath);
      } catch (err: any) {
        if (err?.code !== 'ENOENT') {
          console.error('unlink failed:', err);
          return { success: false, message: 'Failed to delete one or more PDF files.' };
        }
      }
    }

    const result = await prisma.receipt.deleteMany({
      where: { id: { in: receiptIds } },
    });

    revalidatePath('/income/receipt/manage');

    return { success: true, deleted: result.count };
  } catch (err) {
    console.error('deleteReceiptsAndFiles error:', err);
    return { success: false, message: 'Failed to bulk delete receipts.' };
  }
};

