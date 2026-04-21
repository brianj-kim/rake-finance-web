'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { 
  BatchFormValues, 
  BatchSchema, 
  EditIncomeFormSchema, 
  type EditIncomeDTO,
  type EditIncomeFormValues, 
  SaveBatchIncomeResult 
} from '@/app/lib/definitions';
import { nameKey } from '@/lib/utils';
import { prisma } from '@/app/lib/prisma';
import { canAccessFinance } from '@/app/lib/auth';

export const saveBatchIncome = async (
  values: BatchFormValues
): Promise<SaveBatchIncomeResult> => {
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

  const parsed = BatchSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: 'Invalid form values.'};

  const { year, month, day, entries } = parsed.data;
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return { success: false, message: 'Invailid date values.'};
  }

  const cleanedEntries = entries.map((e) => ({
    name: nameKey(e.name),
    amount: Number(e.amount),
    typeId: Number(e.typeId),
    methodId: Number(e.methodId),
    note: e.note?.trim() || null
  }))
  .filter((e) => {
    return (
      e.name !== '' &&
      Number.isFinite(e.amount) &&
      e.amount > 0 &&
      Number.isInteger(e.typeId) &&
      e.typeId > 0 &&
      Number.isInteger(e.methodId) &&
      e.methodId > 0
    );
  });

  if (cleanedEntries.length === 0) {
    return { success: false, message: 'No valid entries to save.'};
  }
  
  const uniqueNames = Array.from(new Set(cleanedEntries.map((e) => e.name)));

  try {
    const result = await prisma.$transaction(async (tx) => {  
      const qt = Math.ceil(month / 3);
      
      const existingMembers = await tx.member.findMany({
        where: { name_kFull: { in: uniqueNames } },
        select: { mbr_id: true, name_kFull: true }
      });

      const memberIdByName = new Map(
        existingMembers.map((m) => [m.name_kFull, m.mbr_id])
      );

      const missingNames = uniqueNames.filter((n) => !memberIdByName.has(n));
      let createdMembersCount = 0;

      if (missingNames.length > 0) {
        const createdMembers = await Promise.all(
          missingNames.map(name => 
            tx.member.create({
              data: { name_kFull: name },
              select: { mbr_id: true, name_kFull: true }
            })
          )
        );

        createdMembers.forEach((m) => memberIdByName.set(m.name_kFull, m.mbr_id));
        createdMembersCount = createdMembers.length;

      }

      const incomeRows: Prisma.IncomeCreateManyInput[] = cleanedEntries.map((e) => {
        const memberId = memberIdByName.get(e.name);
        if (!memberId) {
          console.error('Failed to resolve member:', {
            name: e.name,
            hex: Buffer.from(e.name).toString('hex'),
            availableKeys: Array.from(memberIdByName.keys())
          });
          
          throw new Error(`Failed to resolve memberIed for: "${e.name}"`);
        }

        return {
          year,
          month,
          day,
          qt,
          amount: e.amount,
          inc_type: e.typeId,
          inc_method: e.methodId,
          notes: e.note,
          member: memberId
        };
      });

      const createdIncome = await tx.income.createMany({
        data: incomeRows
      });

      return {
        incomeCount: createdIncome.count,
        createdMembers: createdMembersCount
      }
    });

    revalidatePath('/income/list');
    return { success: true, ...result };
  } catch (err: unknown) {
    console.error(err);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, message: `Prisma error: ${err.code}`, meta: err.meta };
    }

    return { success: false, message: 'Failed to save batch income.' };
  } 
};

export type UpdateIncomeFieldErrors = Partial<Record<keyof EditIncomeFormValues, string>>;

export type UpdateIncomeResult = 
  | { success: true }
  | { success: false; message: string; fieldErrors?: UpdateIncomeFieldErrors };

type GetIncomeForEditResult =
  | { success: true, income: EditIncomeDTO }
  | { success: false; message: string } 

export const getIncomeForEdit = async (incomeId: unknown): Promise<GetIncomeForEditResult> => {
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

  const parsedIncomeId = Number(incomeId);

  if (!Number.isInteger(parsedIncomeId) || parsedIncomeId <= 0) {
    return { success: false, message: 'Invalid income id.'};
  }

  try {
    const income = await prisma.income.findUnique({
      where: { inc_id: parsedIncomeId },
      include: {
        Member: {
          select: {
            name_kFull: true,
          },
        },
      },
    });

    if (!income) {
      return { success: false, message: 'Income entry not found.'};
    }

    return {
      success: true,
      income: {
        inc_id: income.inc_id,
        name: income.Member?.name_kFull ?? '',
        amount: income.amount ?? 0,
        inc_type: income.inc_type ?? 0,
        inc_method: income.inc_method ?? 0,
        notes: income.notes ?? '',
        year: income.year ?? new Date().getFullYear(),
        month: income.month ?? 1,
        day: income.day ?? 1,
      },
    };
  } catch (err) {
    console.error('getIncomeForEdit error:', err);
    return { success: false, message: 'Failed to load income.' };
  }
};

export const updateIncome = async (input: unknown): Promise<UpdateIncomeResult> => {
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' }; 
  }

  const parsed = EditIncomeFormSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: UpdateIncomeFieldErrors = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !(key in fieldErrors)) {
        fieldErrors[key as keyof EditIncomeFormValues] = issue.message;
      }
    }
    
    return {
      success: false,
      message: 'Invalid form values.',
      fieldErrors,
    };
  }

  const {
    inc_id,
    name,
    amount,
    typeId,
    methodId,
    notes,
    year,
    month,
    day,
  } = parsed.data;

  const qt = Math.ceil(month / 3);
  const cleanedName = nameKey(name);

  try {
    await prisma.$transaction(async (tx) => {
      const member = 
      (await tx.member.findUnique({
        where: { name_kFull: cleanedName },
        select: { mbr_id: true },
      })) ??
      (await tx.member.create({
        data: {
          name_kFull: cleanedName,
          note: name.trim() === cleanedName ? null : name.trim(),
        },
        select: { mbr_id: true },
      }));

      await tx.income.update({
        where: { inc_id },
        data: {
          amount,
          inc_type: typeId,
          inc_method: methodId,
          notes: notes?.trim() ? notes.trim() : null,
          year,
          month,
          day,
          qt,
          member: member.mbr_id,
        },
      });
    });

    revalidatePath('/income');
    revalidatePath('/income/list');
    revalidatePath(`/income/list/${inc_id}/edit`);
    revalidatePath('/income/receipt');

    return { success: true };
  } catch (err) {
    console.error('updateIncome error:', err);
    return {
      success: false,
      message: 'Failed to update income.',
    };
  }
};

export const deleteIncome = async (incomeId: number) => {
  if (!(await canAccessFinance())) {
    return {
      success: false,
      message: 'Forbidden'
    };
  }

  try {
    if(!incomeId || incomeId <= 0) {
      return {
        success: false,
        message: 'Invalid income ID'
      };
    }

    const existingIncome = await prisma.income.findUnique({
      where: {
        inc_id: incomeId
      }
    });

    if (!existingIncome) {
      return {
        success: false,
        message: 'Income entry not found.'
      };
    }

    await prisma.income.delete({
      where: {
        inc_id: incomeId
      }
    });

    revalidatePath('/income/list');

    return {
      success: true,
      message: 'Income deleted successfully.'
    };
  } catch (error) {
    console.error('Error deleting income:', error);
    return {
      success: false,
      message: 'Failed to delete income. Please try again.'
    };
  }
}
