'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { BatchFormValues, BatchSchema, IncomeSchema, SaveBatchIncomeResult } from '@/app/lib/definitions';
import { nameKey } from '@/lib/utils';
import { prisma } from '@/app/lib/prisma';

export const saveBatchIncome = async (
  values: BatchFormValues
): Promise<SaveBatchIncomeResult> => {

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


export const updateIncome = async (id: number, formData: FormData) => {
  // Convert FormData to object for Zod validation
  const rawData = {
    name: formData.get('name'),
    amount: formData.get('amount'),
    type: formData.get('type'),
    method: formData.get('method'),
    notes: formData.get('notes')
  };

  const validatedFields = IncomeSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  // Extract Date Fields
  const year = parseInt(formData.get('year') as string);
  const month = parseInt(formData.get('month') as string);
  const day = parseInt(formData.get('day') as string);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return { success: false, message: 'Invalid date values' };
  }

  const qt = Math.ceil(month / 3);

  const { name, amount, type, method, notes } = validatedFields.data;

  const cleanedName = nameKey(name);

  try {
    await prisma.$transaction(async (tx) => {
      const member = 
        (await tx.member.findUnique({
          where: { name_kFull: cleanedName },
          select: { mbr_id: true }
        })) ??
        (await tx.member.create({
          data: { 
            name_kFull: cleanedName,
            note: name.trim(), 
          },
          select: { mbr_id: true }
        }));

        await tx.income.update({
          where: { inc_id: id },
          data: {
            amount,
            inc_type: parseInt(type, 10),
            inc_method: parseInt(method, 10),
            notes: notes ?? null,
            year,
            month,
            day,
            qt,
            member: member.mbr_id
          }
        })
    })

    revalidatePath('/income/list');
    return { success: true }
  } catch (error) {
    console.error('Update Error:', error);
    return { success: false, message: 'Databases Error' };
  }


}

export const deleteIncome = async (incomeId: number) => {
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