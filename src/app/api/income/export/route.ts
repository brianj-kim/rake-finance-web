import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from '@/app/lib/prisma';

const toInt = (v: string | null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const runtime = 'nodejs';

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const year = toInt(searchParams.get('year'));
  const month = toInt(searchParams.get('month'));
  const day = toInt(searchParams.get('day'));
  const q = (searchParams.get('query') ?? '').trim();

  if (!year) {
    return new Response('Missing year', { status: 400 });
  }

  const AND: Prisma.IncomeListWhereInput[] = [{ year }];
  if (month > 0) AND.push({ month });
  if (day > 0) AND.push({ day });
  if (q) AND.push({ name: { contains: q, mode: 'insensitive'} });

  const rows = await prisma.incomeList.findMany({
    where: { AND },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { day: 'desc' }, { created_at: 'desc' }],

    select: {
      inc_id: true,
      year: true,
      month: true,
      day: true,
      name: true,
      type: true,
      method: true,
      amount: true,
      notes: true,
      created_at: true,
    },
  });

  const ExcelJS = (await import('exceljs')).default;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Income');

  ws.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Date', key: 'date', width: 21 },
    { header: 'Name', key: 'name', width: 22 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Method', key: 'method', width: 14 },
    { header: 'Amount (cents)', key: 'amountCents', width: 16 },
    { header: 'Amount ($)', key: 'amountDollars', width: 12 },
    { header: 'Notes', key: 'notes', width: 30 },
    { header: 'Created', key: 'created', width: 20 },    
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle' };

  for (const r of rows) {
    const y = r.year ?? year;
    const mm = String(r.month ?? 0).padStart(2, '0');
    const dd = String(r.day ?? 0).padStart(2, '0');
    const amountCents = r.amount ?? 0;

    ws.addRow({
      id: r.inc_id ?? '',
      date: `${y}-${mm}-${dd}`,
      name: r.name ?? '',
      type: r.type ?? '',
      method: r.method ?? '',
      amountCents,
      amountDollars: amountCents / 100,
      notes: r.notes ?? '',
      created: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10).replace('T', ' ') : '',
    });
  }

  ws.getColumn('amountDollars').numFmt = '$#,##0.00';

  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();

  const filenameParts = [`income_${year}`];
  if (month > 0) filenameParts.push(`m${String(month).padStart(2, '0')}`);
  if (day > 0) filenameParts.push(`d${String(day).padStart(2, '0')}`);
  if (q) filenameParts.push('filtered');

  const filename = `${filenameParts.join('_')}.xlsx`;

  return new Response(Buffer.from(buffer), {
    headers: {
      "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    }
  });
}
