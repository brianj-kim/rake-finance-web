'use server';

import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import { ReceiptListResult } from './definitions';
import { RECEIPT_EXCLUDE_NAMES } from '@/app/lib/receipt-constants';

const ITEMS_PER_PAGE = 30;


export const fetchReceipts = async (input: {
  query: string;
  page: number;
  taxYear: number;
}): Promise<ReceiptListResult> => {
  const query = (input.query ?? '').trim();
  const page = Math.max(1, Number(input.page) || 1);
  const taxYear = Number(input.taxYear);

  const baseWhere: Prisma.ReceiptWhereInput = {
    taxYear,
    Member: { is: { name_kFull: { notIn: [...RECEIPT_EXCLUDE_NAMES] } } },
  };

  const where: Prisma.ReceiptWhereInput = query
  ? {
      AND: [
        baseWhere,
        {
          OR: [
            { donorName: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { Member: { is: { name_kFull: { contains: query, mode: Prisma.QueryMode.insensitive } } } },
            { Member: { is: { name_eFirst: { contains: query, mode: Prisma.QueryMode.insensitive } } } },
            { Member: { is: { name_eLast: { contains: query, mode: Prisma.QueryMode.insensitive } } } },
          ],
        },
      ],
    }
  : baseWhere;

  const totalItems = await prisma.receipt.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const rows = await prisma.receipt.findMany({
    where,
    orderBy: [{ issueDate: 'desc'}, { serialNumber: 'desc' }],
    skip: (safePage -1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    select: {
      id: true,
      taxYear: true,
      serialNumber: true,
      issueDate: true,
      memberId: true,
      donorName: true,
      totalCents: true,
      pdfUrl: true,
    },
  });

  return {
    data: rows.map((r) => ({
      id: r.id,
      taxYear: r.taxYear,
      serialNumber: r.serialNumber,
      issueDateISO: r.issueDate.toISOString().slice(0, 10),
      memberId: r.memberId,
      donorName: r.donorName,
      totalCents: r.totalCents,
      pdfUrl: r.pdfUrl,
    })),
    pagination: { totalPages, totalItems },
  };
}