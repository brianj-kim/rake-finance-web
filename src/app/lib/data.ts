'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from "next/cache"; // for save income entries

import { BatchEntry, BatchIncomeDTO, CategoryDTO, IncomeSummary } from '@/app/lib/definitions';
import { z } from 'zod';
import { normalizeName } from '@/lib/utils';
import { prisma } from './prisma';


const ITEMS_PER_PAGE = 30 as const;
const INCOME_LIST_PATH = '/income/list';

type ActionOK<T extends object = object> = { success: true } & T;
type ActionFail = { success: false, message: string };
type ActionResult<T extends object = object> = ActionOK<T> | ActionFail;

const isP2002 = (e: unknown) => 
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';


const buildIncomeListWhere = (args: {
    selectedYear: number;
    selectedMonth?: number;
    selectedDay?: number;
    query?: string;
}): Prisma.IncomeListWhereInput => {
    const { selectedYear, selectedMonth, selectedDay, query } = args;

    const AND: Prisma.IncomeListWhereInput[] = [{ year: selectedYear }];

    if (selectedMonth && selectedMonth > 0) AND.push({ month: selectedMonth });
    if (selectedDay && selectedDay > 0) AND.push({ day: selectedDay });

    const q = query?.trim();
    if (q) {
        AND.push({ name: { contains: q, mode: 'insensitive'} });
    }

    return { AND };
};

export const fetchCardData = async (year: number): Promise<IncomeSummary> => {
    // Categories (range='inc')
    const categories = await getIncomeTypes();
    const categoryIds = categories.map((c) => c.id);

    const grouped = await prisma.income.groupBy({
        by: ['inc_type'],
        _sum: { amount: true },
        where: {
            year,
            inc_type: { in: categoryIds }
        }
    });

    const sumMap = new Map(grouped.map((g) => [g.inc_type, g._sum.amount ?? 0]));

    const byCategory = categories.map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        order: c.order ?? null,
        sum: sumMap.get(c.id) ?? 0,
    }));

    const total = byCategory.reduce((acc, r) => acc + r.sum, 0);
    return { total, byCategory };
};

export const fetchLatestIncome = async (year: number) => {
    return prisma.incomeList.findMany({
        where: { year },
        orderBy: [{ month: 'desc'}, { day: 'desc' }, { created_at: 'desc' }],
        take: 5
    });
};

export const fetchFilteredIncome = async (
    query: string,
    currentPage: number,
    selectedYear: number,
    selectedMonth?: number,
    selectedDay?: number
) => {
    const page = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1;
    const offset = (page -1) * ITEMS_PER_PAGE;

    const where = buildIncomeListWhere({
        selectedYear,
        selectedMonth,
        selectedDay,
        query
    });

    const [rows, totalCount] = await Promise.all([
        prisma.incomeList.findMany({
            where,
            orderBy: [{ year: 'desc' }, { month: 'desc' }, {day: 'desc' }],
            take: ITEMS_PER_PAGE,
            skip: offset
        }),
        prisma.incomeList.count({ where })
    ]);

    return {
        data: rows,
        pagination: {
            currentPage: page,
            pageSize: ITEMS_PER_PAGE,
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE)
        }
    };
};

export const getMonthDayOptions = async (year: number) => {
    const rows = await prisma.incomeList.findMany({
        where: { year },
        select: { month: true, day: true },
        distinct: ['month', 'day'],
        orderBy: [{ month: 'asc' }, { day: 'asc' }]
    });

    return rows
        .filter((r) => r.month != null && r.day != null)
        .map((r) => ({ month: r.month as number, day: r.day as number }));
};

export const getDays = async (year: number, month: number) => {
    const rows = await prisma.incomeList.findMany({
        where: { year, month },
        select: { day: true },
        distinct: ['day'],
        orderBy: [{ day: 'asc' }]
    });

    return rows
        .filter((r) => r.day != null)
        .map((r) => ({ day: r.day as number }));
};

const getCategoriesByRange = async (range: 'inc' | 'imd'): Promise<CategoryDTO[]> => {
    const rows = await prisma.category.findMany({
        select: { ctg_id: true, name: true, detail: true, order: true, range: true },
        orderBy: { order: 'asc'},
        where: { range }        
    });

    return rows.map((row) => ({
        id: row.ctg_id,
        name: (row.name ?? '').trim(),
        detail: row.detail ?? null,
        order: row.order ?? null,
        range: row.range ?? null,
    }));
};

export const getIncomeTypes = async (): Promise<CategoryDTO[]> => getCategoriesByRange('inc');
export const getIncomeMethods = async (): Promise<CategoryDTO[]> => getCategoriesByRange('imd');

export const saveBatchIncome = async (data: BatchIncomeDTO): Promise<ActionResult<{ count: number }>> => {
    try {
        const { year, month, day, entries } = data;

        const y = Number(year);
        const m = Number(month);
        const d = Number(day);

        if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
            return { success: false, message: 'Invalid date values.' };
        }

        const rowsToSave = entries
            .filter((entry: BatchEntry) => entry.name.trim() !== '' && entry.amount > 0)
            .map((entry: BatchEntry) => ({
                year: y,
                month: m,
                day: d,
                amount: Math.round(entry.amount),
                inc_type: entry.type,
                inc_method: entry.method,
                notes: entry.note?.trim() ? entry.note.trim() : null,
                qt: Math.ceil(m / 3)
            }));
        if (rowsToSave.length === 0) {
            return { success: false, message: 'No valid entries were provided.' };
        }

        await prisma.income.createMany({ 
            data: rowsToSave,
            skipDuplicates: true
        });

        revalidatePath(INCOME_LIST_PATH);
        return { success: true, count: rowsToSave.length };
    } catch (e) {
        console.error('Batch Save Error:', e);
        return { success: false, message: 'Database failure. Pleases try again'};
    }
};


// For update Income Entry
const UpdateIncomeSchema = z.object({
    incId: z.coerce.number().int().positive(),
    year: z.coerce.number().int(),
    month: z.coerce.number().int().min(1).max(12),
    day: z.coerce.number().int().min(1).max(31),
    name: z.string().trim().min(1),
    amount: z.coerce.number().int().positive(),
    typeId: z.coerce.number().int().positive(),
    methodId: z.coerce.number().int().positive(),
    note: z.string().trim().optional().nullable()
});

export const updateIncome = async (input: unknown): Promise<ActionResult<{ memberId: number }>> => {
    const parsed = UpdateIncomeSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, message: 'Invalid form values.' };
    }

    const { incId, year, month, day, name, amount, typeId, methodId, note } = parsed.data;
    const qt = Math.ceil(month / 3);
    const cleanName = normalizeName(name);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.member.findFirst({
                where: { name_kFull: cleanName },
                select: { mbr_id: true }
            });

            let memberId = existing?.mbr_id;

            if (!memberId) {
                try {
                    const created = await tx.member.create({
                        data: { name_kFull: cleanName },
                        select: { mbr_id: true }
                    });

                    memberId = created.mbr_id;
                } catch (e) {
                    if(isP2002(e)) {
                        const again = await tx.member.findFirst({
                            where: { name_kFull: cleanName },
                            select: { mbr_id: true }
                        });
                        if (!again?.mbr_id) throw e;
                        memberId = again.mbr_id;
                    } else {
                        throw e;
                    }
                }
            }

            await tx.income.update({
                where: { inc_id: incId },
                data: {
                    year,
                    month,
                    day,
                    qt,
                    amount,
                    inc_type: typeId,
                    inc_method: methodId,
                    notes: note?.trim() ? note.trim() : null,
                    member: memberId
                }
            });

            return { memberId };
        });

        revalidatePath(INCOME_LIST_PATH);
        return { success: true, ...result };
    } catch (e) {
        console.error(e);
        return { success: false, message: 'Failed to update income.' };
    }
};

// Income Deletion - server action
export const deleteIncome = async (incId: number): Promise<ActionResult> => {
    try {
        await prisma.income.delete({ where: { inc_id: incId } });
        revalidatePath(INCOME_LIST_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: 'Failed to delete.' };
    }
};

// Member list page actions
const MEMBERS_PER_PAGE = 24 as const;

export const fetchFilteredMembers = async (query: string, currentPage: number) => {
    const page = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1;
    const offset = (page - 1) * MEMBERS_PER_PAGE;

    const q = query.trim();

    const where: Prisma.MemberWhereInput =
        q.length > 0
            ? {
                OR: [
                    { name_kFull: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { address: { contains: q, mode: 'insensitive' } }
                ]
            }
            : {};
    
    const [rows, totalCount] = await Promise.all([
        prisma.member.findMany({
            where,
            orderBy: { created_at: 'desc' },
            select: {
                mbr_id: true,
                name_kFull: true,
                name_eFirst: true,
                name_eLast: true,
                email: true,
                city: true,
                postal: true
            },
            take: MEMBERS_PER_PAGE,
            skip: offset
        }),
        prisma.member.count({ where })
    ]);

    return {
        data: rows,
        pagination: {
            currentPage: page,
            pageSize: MEMBERS_PER_PAGE,
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / MEMBERS_PER_PAGE)
        }
    };
};
// Member list page actions - end



export type IncomeKpi = {
    yearTotalCents: number;
    monthTotalCents: number;
    donationCount: number;
    uniqueDonors: number;
};

export const getIncomeKpis = async (year: number): Promise<IncomeKpi> => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const [yearAgg, monthAgg, donationCount, uniqueDonors] = await Promise.all([
        prisma.income.aggregate({
            where: { year },
            _sum: { amount: true },
        }),
        prisma.income.aggregate({
            where: { year, month },
            _sum: { amount: true },
        }),
        prisma.income.count({ where: { year } }),
        prisma.income.groupBy({
            by: ['member'],
            where: {
                year,
                member: { not: null }, 
            },
        }),
    ]);

    return {
        yearTotalCents: yearAgg._sum.amount ?? 0,
        monthTotalCents: monthAgg._sum.amount ?? 0,
        donationCount,
        uniqueDonors: uniqueDonors.length,
    };
};

// For the dashboard stats 
export type MonthlyTotal = { month: number; totalCents: number; };

// Monthly
export const getMonthlyTotals = async (year: number): Promise<MonthlyTotal[]> => {
    const rows = await prisma.income.groupBy({
        by: ['month'],
        where: { year, amount: { not: null }, month: { not: null } },
        _sum: { amount: true },
        orderBy: { month: 'asc' },
    });

    const map = new Map(rows.map(r => [r.month ?? 0, r._sum.amount ?? 0]));

    return Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        return { month: m, totalCents: map.get(m) ?? 0 };
    });
};

// Quarterly
export type QuarterlyTotal = { quarter: number; totalCents: number; };

export const getQuarterlyTotals = async (year: number): Promise<QuarterlyTotal[]> => {
    const rows = await prisma.income.groupBy({
        by: ['qt'],
        where: { year, amount: { not: null }, qt: { not: null } },
        _sum: { amount: true },
        orderBy: { qt: 'asc' },
    });

    const map = new Map(rows.map(r => [r.qt ?? 0, r._sum.amount ?? 0]));
    return [1,2,3,4].map((q) => ({ quarter: q, totalCents: map.get(q) ?? 0 }));
};

// Breakdown by Type (헌금종류)
export type CategoryBreakDownRow = { id: number; name: string; totalCents: number };

export const getTypeBreakdown = async (year: number): Promise<CategoryBreakDownRow[]> => {
    const rows = await prisma.income.groupBy({
        by: ['inc_type'],
        where: { year, amount: { not: null }, inc_type: { not: null } },
        _sum: { amount: true },
    });

    const ids = rows.map(r => r.inc_type!).filter(Boolean);

    const cats = await prisma.category.findMany({
        where: { ctg_id: { in: ids }, range: 'inc' },
        select: { ctg_id: true, name: true, order: true },
    });

    const sumMap = new Map(rows.map(r => [r.inc_type!, r._sum.amount ?? 0]));
    const orderMap = new Map(cats.map(c => [c.ctg_id, c.order ?? 999]));

    const rowsWithOrder = cats
        .map((c) => ({
            id: c.ctg_id,
            name: c.name,
            totalCents: sumMap.get(c.ctg_id) ?? 0,
            sortOrder: orderMap.get(c.ctg_id) ?? 999,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder);

    return rowsWithOrder.map(({ id, name, totalCents }) => ({ id, name, totalCents }));
};


// Breaktdown by method (헌금 납입 방법)
export const getMethodBreakdown = async (year: number): Promise<CategoryBreakDownRow[]> => {
    const rows = await prisma.income.groupBy({
        by: ['inc_method'],
        where: { year, amount: { not: null }, inc_method: { not: null } },
        _sum: { amount: true },
    });

    const ids = rows.map(r => r.inc_method!).filter(Boolean);

    const cats = await prisma.category.findMany({
        where: { ctg_id: { in: ids }, range: 'imd' },
        select: { ctg_id: true, name: true, order: true },
    });

    const sumMap = new Map(rows.map(r => [r.inc_method!, r._sum.amount ?? 0]));
    const orderMap = new Map(cats.map(c => [c.ctg_id, c.order ?? 999]));

    const rowsWithOrder = cats
        .map((c) => ({
            id: c.ctg_id,
            name: c.name,
            totalCents: sumMap.get(c.ctg_id) ?? 0,
            sortOrder: orderMap.get(c.ctg_id) ?? 999,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder);

    return rowsWithOrder.map(({ id, name, totalCents }) => ({ id, name, totalCents }));
};
