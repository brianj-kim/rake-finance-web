'use server';

import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';

import { formatEnglishName, truncate } from '@/app/lib/utils';
import type { DonationRow, PagedResult, ReceiptMemberInfo, ReceiptMemberSummary } from '@/app/lib/definitions';

import { RECEIPT_EXCLUDE_NAMES } from '@/app/lib/receipt-constants';

const RECEIPT_EXCLUDE_SET = new Set<string>(RECEIPT_EXCLUDE_NAMES);

const baseWhere: Prisma.MemberWhereInput = {
  name_kFull: { notIn: [...RECEIPT_EXCLUDE_NAMES] },
};

let ITEMS_PER_PAGE = 12;

const toCents = (n: unknown) => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

export const getReceiptMemberMenu = async (input: {
  taxYear: number;
  page?: number;
  query?: string;
}): Promise<PagedResult<ReceiptMemberSummary>> => {
  ITEMS_PER_PAGE = 30;
  const taxYear = Number(input.taxYear);
  const page = Math.max(1, Number(input.page ?? 1) || 1);
  const query = (input.query ?? '').trim();

  const where: Prisma.MemberWhereInput | undefined = query
    ? {
        AND: [
          baseWhere,
          {
            OR: [
              { name_kFull: { contains: query, mode: Prisma.QueryMode.insensitive } },
              { name_eFirst: { contains: query, mode: Prisma.QueryMode.insensitive } },
              { name_eLast: { contains: query, mode: Prisma.QueryMode.insensitive } },
            ],
          },
        ],        
      }
    : undefined;

  const totalItems = await prisma.member.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const members = await prisma.member.findMany({
    where,
    orderBy: [{ name_kFull: 'asc' }],
    skip: (safePage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    select: {
      mbr_id: true,
      name_kFull: true,
      name_eFirst: true,
      name_eLast: true,
    },
  });

  const ids = members.map((m) => m.mbr_id);

  const aggs =
    ids.length === 0
      ? []
      : await prisma.income.groupBy({
          by: ['member'], // adjust if your Income uses memberId
          where: { year: taxYear, member: { in: ids }, amount: { gt: 0 } },
          _count: { _all: true },
          _sum: { amount: true },
        });

  const aggMap = new Map<number, { donationCount: number; totalCents: number }>();
  for (const a of aggs) {
    const key = a.member;
    if (key != null) {
      aggMap.set(key, {
        donationCount: a._count._all ?? 0,
        totalCents: toCents(a._sum.amount)
      })
    }    
  }

  // receipts for this year for these member (latest first)
  const receipts = 
    ids.length === 0
      ? []
      : await prisma.receipt.findMany({
        where: {
          taxYear,
          memberId: { in: ids },
        },
        select: {
          memberId: true,
          pdfUrl: true,
          issueDate: true,
          serialNumber: true,
        },
        orderBy: [{ issueDate: 'desc' }, { serialNumber: 'desc' }],        
      });

  const receiptMap = new Map<number, string>();
  for (const r of receipts) {
    if (!receiptMap.has(r.memberId)) {
      receiptMap.set(r.memberId, r.pdfUrl!);
    }
  }

  return {
    items: members.map((m) => {
      const oName =
        truncate(formatEnglishName(m.name_eFirst, m.name_eLast) ?? 'Official name is not set yet', 80);
      const kName = m.name_kFull;
      const agg = aggMap.get(m.mbr_id);
      return {
        memberId: m.mbr_id,
        oName,
        kName,
        donationCount: agg?.donationCount ?? 0,
        totalCents: agg?.totalCents ?? 0,
        pdfUrl: receiptMap.get(m.mbr_id) ?? null,
      };
    }),
    page: safePage,
    totalPages,
    totalItems,
  };
}

export async function getReceiptMemberInfo(input: { memberId: number }): Promise<ReceiptMemberInfo | null> {
  const memberId = Number(input.memberId);
  const m = await prisma.member.findUnique({
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

  if (!m) return null;
  if (RECEIPT_EXCLUDE_SET.has(m.name_kFull)) return null;


  const nameOfficial =
    truncate(formatEnglishName(m.name_eFirst, m.name_eLast) ?? 'Official Name is not set yet', 80) ?? '-';

  return {
    memberId: m.mbr_id,
    nameOfficial,
    name_kFull: m.name_kFull,
    address: m.address,
    city: m.city,
    province: m.province,
    postal: m.postal,
  };
}

export async function getMemberDonationsForYear(input: {
  memberId: number;
  taxYear: number;
}): Promise<DonationRow[]> {
  const memberId = Number(input.memberId);
  const taxYear = Number(input.taxYear);

  const m = await prisma.member.findUnique({
              where: { mbr_id: memberId },
              select: { name_kFull: true },
            });

  if (!m) return [];
  if (RECEIPT_EXCLUDE_SET.has(m.name_kFull)) return [];

  const rows = await prisma.income.findMany({
    where: { member: memberId, year: taxYear, amount: { gt: 0 } },
    select: { 
      inc_id: true, 
      month: true, 
      day: true, 
      amount: true, 
      notes: true, 
      Category_Income_inc_typeToCategory: { select: { name: true } },
      Category_Income_inc_methodToCategory: { select: { name: true }},
    },
    orderBy: [{ month: 'asc' }, { day: 'asc' }, { inc_id: 'asc' }],
  });

  return rows.map((r) => ({
    incId: r.inc_id,
    dateISO: `${taxYear}-${String(r.month).padStart(2, '0')}-${String(r.day).padStart(2, '0')}`,
    amountCents: toCents(r.amount),
    typeName: r.Category_Income_inc_typeToCategory?.name ?? null,
    methodName: r.Category_Income_inc_methodToCategory?.name ?? null,
    notes: r.notes ?? null,
  }));
}

// Receipt Stats for the Income dashboard
export type ReceiptStats = {
    taxYear: number;
    totalMembers: number;
    generatedCount: number;
    notGeneratedCount: number;
};

export const getReceiptStats = async (taxYear: number): Promise<ReceiptStats> => {
  const [totalMembers, generatedMembers] = await Promise.all([
    prisma.member.count({
      where: { name_kFull: { notIn: [...RECEIPT_EXCLUDE_NAMES] } },
    }),
    prisma.receipt.groupBy({
      by: ["memberId"],
      where: {
        taxYear,
        Member: { name_kFull: { notIn: [...RECEIPT_EXCLUDE_NAMES] } },
      },
    }),
  ]);

  const generatedCount = generatedMembers.length;
  const notGeneratedCount = Math.max(0, totalMembers - generatedCount);

  return { taxYear, totalMembers, generatedCount, notGeneratedCount };
}
