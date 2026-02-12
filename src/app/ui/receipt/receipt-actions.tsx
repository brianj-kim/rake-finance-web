'use server';

import { revalidatePath } from 'next/cache';
import path from 'path';
import fs from 'fs/promises';
import { Prisma } from '@prisma/client';

import { prisma } from '@/app/lib/prisma';
import { formatEnglishName, truncate } from '@/app/lib/utils';
import { bufferFromReactPdf } from '@/app/lib/buffer-from-reactPDF';
import ReceiptDocument from './receipt-document';

type ActionOK = {
  success: true;
  receiptId: string;
  serialNumber: number;
  pdfUrl: string;
};

type ActionFail = {
  success: false;
  message: string;
};

export type GenerateAnnualReceiptResult = ActionOK | ActionFail;

const toISODate = (d: Date) => d.toISOString().slice(0,10);

const isUniqueViolation = (err: unknown) => 
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';


export const generateAnnualReceipt = async (input: {
  memberId: number;
  taxYear: number;
}): Promise<GenerateAnnualReceiptResult> => {
  const memberId = Number(input.memberId);
  const taxYear = Number(input.taxYear);

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return { success: false, message: 'Invalid memberId' };
  }
  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) {
    return { success: false, message: 'Invalid tax year' };
  }

  const [member, charity] = await Promise.all([
    prisma.member.findUnique({
      where: {mbr_id: memberId },
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
    prisma.charityProfile.findUnique({ where: { id: 1 }}),
  ]);

  if (!member) return { success: false, message: 'Member not found.' };
  if (!charity) return { success: false, message: 'Charity profile is not set up yet.' };

  const donations = await prisma.income.findMany({
    where: { member: memberId, year: taxYear },
    select: { month: true, day: true, amount: true, inc_id: true },
    orderBy: [{ month: 'asc'}, { day: 'asc' }, {inc_id: 'asc' }],
  });

  const lines = donations
      .filter((d) => Number.isInteger(d.month) && Number.isInteger(d.day) && Number.isInteger(d.amount) && (d.amount ?? 0) > 0 )
      .map((d) => ({
        date: `${taxYear}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`,
        amountCents: d.amount as number,
      }));

  const totalCents = lines.reduce((acc, r) => acc + r.amountCents, 0);
  if (totalCents <= 0) return { success: false, message: 'No donations found for that year.' };

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
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const agg = await tx.receipt.aggregate({
          where: { taxYear },
          _max: { serialNumber: true },
        });

        const nextSerial = (agg._max.serialNumber ?? 0) + 1;

        const doc = (
          <ReceiptDocument 
            taxYear={taxYear}
            serialNumber={nextSerial}
            issueDateISO={issueDateISO}
            charity={{
              legalName: charityName,
              registrationNo: charityRegNo,
              address: charityAddress,
              city: charityCity,
              province: charityProvince,
              postal: charityPostal,
              locationIssued,
              authorizedSigner,
            }}
            donor={{
              name_official: donorName,
              address: donorAddress,
              city: donorCity,
              province: donorProvince,
              postal: donorPostal,
            }}
            totalCents={totalCents}
            lines={lines}
          />
        );

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

      revalidatePath(`/income/member/${memberId}/receipts`);
      return { success: true, ...created };
    } catch (err) {
      if (isUniqueViolation(err) && attempt < MAX_RETRIES) continue;
      console.error('generateAnnualReceipt error:', err);
      return { success: false, message: 'Failed to generate receipt. Please try again.' };
    }
  }

  return { success: false, message: 'Failed to generate receipt due to serial-number conflicts. Please try again.' };
};
