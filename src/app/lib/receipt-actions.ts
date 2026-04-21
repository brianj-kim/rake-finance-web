'use server';

import { prisma } from '@/app/lib/prisma';
import { Prisma, ReceiptStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { revalidatePath } from 'next/cache';

import { createElement } from 'react';

import ReceiptDocument, { ReceiptDocumentProps } from '@/app/ui/receipt/receipt-document';
import { formatEnglishName, truncate } from '@/app/lib/utils';
import { bufferFromReactPdf } from '@/app/lib/pdf/buffer-from-react-pdf';
import type { ActionFail, ActionOK, ActionResult } from '@/app/lib/definitions';

import { canAccessFinance } from '@/app/lib/auth';

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const isUniqueViolation = (err: unknown) => 
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

const isTransactionConflict = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';

const isErrnoException = (err: unknown): err is NodeJS.ErrnoException => {
  return err instanceof Error && 'code' in err;
};

const isInt = (v: unknown): v is number => Number.isInteger(v);

class ReceiptOverlapError extends Error {
  readonly incomeIds: number[];

  constructor(incomeIds: number[]) {
    super(`Selected donations were already receipted: ${incomeIds.join(', ')}`);
    this.name = 'ReceiptOverlapError';
    this.incomeIds = incomeIds;
  }
}

class UnauditedReceiptError extends Error {
  readonly receiptLabel: string;

  constructor(receiptLabel: string) {
    super(`Existing receipt ${receiptLabel} has no donation audit rows.`);
    this.name = 'UnauditedReceiptError';
    this.receiptLabel = receiptLabel;
  }
}

type IncomeDonationCandidate = {
  inc_id: number;
  month: number | null;
  day: number | null;
  amount: number | null;
};

type ReceiptDonationSnapshot = {
  incomeId: number;
  amountCents: number;
  receivedDate: Date;
  line: {
    date: string;
    amountCents: number;
  };
};

const getReceivedDate = (taxYear: number, month: number | null, day: number | null) => {
  if (!isInt(month) || !isInt(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(taxYear, month - 1, day));
  if (
    date.getUTCFullYear() !== taxYear ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const buildReceiptDonationSnapshots = (
  taxYear: number,
  donations: IncomeDonationCandidate[]
): ReceiptDonationSnapshot[] =>
  donations.flatMap((donation) => {
    const amountCents = Number(donation.amount) || 0;
    const receivedDate = getReceivedDate(taxYear, donation.month, donation.day);

    if (!receivedDate || amountCents <= 0) {
      return [];
    }

    return [
      {
        incomeId: donation.inc_id,
        amountCents,
        receivedDate,
        line: {
          date: toISODate(receivedDate),
          amountCents,
        },
      },
    ];
  });

const assertReceiptableDonations = async (
  tx: Prisma.TransactionClient,
  input: {
    memberId: number;
    taxYear: number;
    incomeIds: number[];
  }
) => {
  const unauditedReceipt = await tx.receipt.findFirst({
    where: {
      memberId: input.memberId,
      taxYear: input.taxYear,
      status: { not: ReceiptStatus.cancelled },
      donations: { none: {} },
    },
    select: { taxYear: true, serialNumber: true },
  });

  if (unauditedReceipt) {
    throw new UnauditedReceiptError(
      `${unauditedReceipt.taxYear}-${String(unauditedReceipt.serialNumber).padStart(5, '0')}`
    );
  }

  const overlapping = await tx.receiptDonation.findMany({
    where: {
      incomeId: { in: input.incomeIds },
      receipt: { status: { not: ReceiptStatus.cancelled } },
    },
    select: { incomeId: true },
  });

  if (overlapping.length > 0) {
    throw new ReceiptOverlapError([...new Set(overlapping.map((row) => row.incomeId))]);
  }
};

export const generateReceiptForSelected = async (input: {
  memberId: number;
  taxYear: number;
  incomeIds: number[];
}): Promise<ActionResult<{ receiptId: string; serialNumber: number; pdfUrl: string }>> => {
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

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
  if (donations.length !== incomeIds.length) {
    return { success: false, message: 'Some selected donations are unavailable for this member and tax year.' };
  }

  const receiptDonations = buildReceiptDonationSnapshots(taxYear, donations);
  if (receiptDonations.length !== donations.length) {
    return { success: false, message: 'Selected donations must have valid received dates and positive amounts.' };
  }

  const lines = receiptDonations.map((donation) => donation.line);
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
  const charityEmail = truncate(charity.charityEmail, 80);
  const charityPhone = truncate(charity.charityPhone, 20);
  const charityWebsite = truncate(charity.charityWebsite, 120);
  const churchLogoUrl = truncate(charity.churchLogoUrl, 255);
  const authorizedSignatureUrl = truncate(charity.authorizedSignature, 255);

  const issueDate = new Date();
  const issueDateISO = toISODate(issueDate);

  const MAX_RETRIES = 3;

  for (let attempt =1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        await assertReceiptableDonations(tx, {
          memberId,
          taxYear,
          incomeIds: receiptDonations.map((donation) => donation.incomeId),
        });

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
            charityEmail,
            charityPhone,
            charityWebsite,
            churchLogoUrl,
            authorizedSignatureUrl,
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
            status: ReceiptStatus.issued,
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
            charityEmail,
            charityPhone,
            charityWebsite,
            churchLogoUrl,
            locationIssued,
            authorizedSigner,
            authorizedSignatureUrl,

            pdfUrl: null,
            donations: {
              create: receiptDonations.map((donation) => ({
                incomeId: donation.incomeId,
                amountCents: donation.amountCents,
                receivedDate: donation.receivedDate,
              })),
            },
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
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      return { success: true, ...created };
    } catch (err) {
      if ((isUniqueViolation(err) || isTransactionConflict(err)) && attempt < MAX_RETRIES) continue;
      if (err instanceof ReceiptOverlapError) {
        return {
          success: false,
          message: `One or more selected donations are already tied to an active receipt (${err.incomeIds.join(', ')}).`,
        };
      }
      if (err instanceof UnauditedReceiptError) {
        return {
          success: false,
          message: `Receipt ${err.receiptLabel} exists without donation audit rows. Cancel it before issuing another receipt for this member and year.`,
        };
      }
      console.error('generateReceiptForSelected error:', err);
      return { success: false, message: 'Failed to generate receipt. Please try again.' };      
    } 
  }

  return { success: false, message: 'Failed due to serial-number conflicts. Please try again.'};
};

export const generateAnnualReceipt = async (input: {
  memberId: number;
  taxYear: number;
}): Promise<ActionResult<{ receiptId: string; serialNumber: number; pdfUrl: string }>> => {
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

  const memberId = Number(input.memberId);
  const taxYear = Number(input.taxYear);

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return { success: false, message: 'Invalid memberId' };
  }
  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) {
    return { success: false, message: 'Invalid tax year' };
  }

  const donations = await prisma.income.findMany({
    where: {
      member: memberId,
      year: taxYear,
      amount: { gt: 0 },
      receiptDonations: {
        none: { receipt: { status: { not: ReceiptStatus.cancelled } } },
      },
    },
    select: { inc_id: true },
    orderBy: [{ month: 'asc' }, { day: 'asc' }, { inc_id: 'asc' }],
  });

  if (donations.length === 0) {
    return { success: false, message: 'No unreceipted donations found for that year.' };
  }

  return generateReceiptForSelected({
    memberId,
    taxYear,
    incomeIds: donations.map((d) => d.inc_id),
  });
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
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

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
      } catch (err: unknown) {
        if (!isErrnoException(err) || err.code !== 'ENOENT') {
          console.error('unlink failed:', err);
          return { success: false, message: 'Failed to remove PDF file.' };
        }
      }
    }

    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: ReceiptStatus.cancelled,
        pdfUrl: null,
      },
    });

    revalidatePath('/income/receipt/manage');
    revalidatePath(`/income/receipt/${receipt.memberId}/receipts`);

    return { success: true };
  } catch (err) {
    console.error('deleteReceiptAndFile error:', err);
    return { success: false, message: 'Failed to cancel receipt.' };
  }
}

// Receipt Bulk Actions
type ReceiptBulkGenOK<T extends object = object> = { success: true } & T;
type ReceiptBulkGenFail = { success: false; message: string };
export type ReceiptBulkGenerationResult<T extends object = object> =
  | ReceiptBulkGenOK<T>
  | ReceiptBulkGenFail;

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
    charityEmail: string | null;
    charityPhone: string | null;
    charityWebsite: string | null;
    churchLogoUrl: string | null;
    authorizedSignature: string | null;
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
      receiptDonations: {
        none: { receipt: { status: { not: ReceiptStatus.cancelled } } },
      },
    },
    select: { month: true, day: true, amount: true, inc_id: true },
    orderBy: [{ month: 'asc' }, { day: 'asc' }, { inc_id: 'asc' }],
  });

  const receiptDonations = buildReceiptDonationSnapshots(taxYear, donations);
  const lines = receiptDonations.map((donation) => donation.line);
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
  const charityEmail = truncate(charity.charityEmail, 80);
  const charityPhone = truncate(charity.charityPhone, 20);
  const charityWebsite = truncate(charity.charityWebsite, 120);
  const churchLogoUrl = truncate(charity.churchLogoUrl, 255);
  const authorizedSignatureUrl = truncate(charity.authorizedSignature, 255);

  const issueDate = new Date();
  const issueDateISO = toISODate(issueDate);

  const MAX_RETRIES = 3;

  for (let attempt =1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        await assertReceiptableDonations(tx, {
          memberId,
          taxYear,
          incomeIds: receiptDonations.map((donation) => donation.incomeId),
        });

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
            charityEmail,
            charityPhone,
            charityWebsite,
            churchLogoUrl,
            authorizedSignatureUrl,
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
            status: ReceiptStatus.issued,

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
            charityEmail,
            charityPhone,
            charityWebsite,
            churchLogoUrl,
            locationIssued,
            authorizedSigner,
            authorizedSignatureUrl,

            pdfUrl,
            donations: {
              create: receiptDonations.map((donation) => ({
                incomeId: donation.incomeId,
                amountCents: donation.amountCents,
                receivedDate: donation.receivedDate,
              })),
            },
          },
          select: { id: true },
        });

        return { receiptId: receipt.id, serialNumber: nextSerial, pdfUrl };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      return { success: true, ...created };
    } catch (err) {
      if ((isUniqueViolation(err) || isTransactionConflict(err)) && attempt < MAX_RETRIES) continue;
      if (err instanceof ReceiptOverlapError) {
        return { success: false, message: `Donations already receipted for memberId=${memberId}` };
      }
      if (err instanceof UnauditedReceiptError) {
        return { success: false, message: `Unaudited active receipt exists for memberId=${memberId}` };
      }
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
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

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
    where: {
      year: taxYear,
      amount: { gt: 0 },
      member: { not: null },
      receiptDonations: {
        none: { receipt: { status: { not: ReceiptStatus.cancelled } } },
      },
    },
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
    where: {
      taxYear,
      memberId: { in: memberIds },
      status: { not: ReceiptStatus.cancelled },
    },
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
        charityEmail: charity.charityEmail,
        charityPhone: charity.charityPhone,
        charityWebsite: charity.charityWebsite,
        churchLogoUrl: charity.churchLogoUrl,
        authorizedSignature: charity.authorizedSignature,
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
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

  const receiptIds = Array.from(
    new Set((input.receiptIds ?? []).map((s) => String(s).trim()))
  ).filter(Boolean);

  if (receiptIds.length === 0) {
    return { success: false, message: 'No receipts selected.' };
  }

  try {
    const receipts = await prisma.receipt.findMany({
      where: { id: { in: receiptIds } },
      select: { id: true, pdfUrl: true, memberId: true },
    });


    for (const r of receipts) {
      const filePath = safePublicFilePathFromUrl(r.pdfUrl);
      if (!filePath) continue;

      try {
        await fs.unlink(filePath);
      } catch (err: unknown) {
        if (!isErrnoException(err) || err.code !== 'ENOENT') {
          console.error('unlink failed:', err);
          return { success: false, message: 'Failed to remove one or more PDF files.' };
        }
      }
    }

    const result = await prisma.receipt.updateMany({
      where: { id: { in: receiptIds } },
      data: {
        status: ReceiptStatus.cancelled,
        pdfUrl: null,
      },
    });

    revalidatePath('/income/receipt/manage');
    for (const memberId of new Set(receipts.map((receipt) => receipt.memberId))) {
      revalidatePath(`/income/receipt/${memberId}/receipts`);
    }

    return { success: true, deleted: result.count };
  } catch (err) {
    console.error('deleteReceiptsAndFiles error:', err);
    return { success: false, message: 'Failed to cancel selected receipts.' };
  }
};
