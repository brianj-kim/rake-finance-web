import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export const GET = async (
  req: NextRequest,
  ctx: Ctx,
) => {
  const { id } = await ctx.params;
  const incomeId = Number(id);

  if (!Number.isInteger(incomeId) || incomeId <= 0 ) {
    return NextResponse.json({ error: 'Invaild id'}, { status: 400 });
  }

  const income = await prisma.income.findUnique({
    where: { inc_id: incomeId },
    include: { Member: { select: { name_kFull: true }}}
  });

  if (!income) {
    return NextResponse.json({ error: 'Not Found'}, { status: 404 });
  }

  return NextResponse.json({
    inc_id: income.inc_id,
    name: income.Member?.name_kFull ?? 's',
    amount: income.amount ?? 0,
    inc_type: income.inc_type ?? 0,
    inc_method: income.inc_method ?? 0,
    notes: income.notes ?? '',
    year: income.year ?? new Date().getFullYear(),
    month: income.month ?? 1,
    day: income.day ?? 1
  });

}