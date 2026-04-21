'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { normalizeSpaces } from '@/lib/utils';
import { prisma } from '@/app/lib/prisma';
import {
  CreateMemberFormSchema,
  type CreateMemberFormValues,
  type EditMemberDTO,
  UpdateMemberFormSchema,
  type UpdateMemberFormValues,
} from '@/app/lib/definitions';
import { canAccessFinance } from '@/app/lib/auth';

const MEMBER_LIST_PATH = '/income/member';

type CreateMemberField = Extract<keyof CreateMemberFormValues, string>;
type UpdateMemberField = Extract<keyof UpdateMemberFormValues, string>;

type ActionOK<T extends object = object> = { success: true } & T;
type ActionFail<TField extends string = string> = {
  success: false;
  message: string;
  fieldErrors?: Partial<Record<TField, string>>;
};

type GetMemberForEditResult = ActionOK<{ member: EditMemberDTO }> | ActionFail;
type UpdateMemberResult = ActionOK | ActionFail<UpdateMemberField>;
type CreateMemberResult = ActionOK<{ memberId: number }> | ActionFail<CreateMemberField>;

const isP2002 = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

const MemberIdSchema = z.number().int().positive();

const toNullableText = (value: string | null | undefined) =>
  value?.trim() ? value.trim() : null;

const buildFieldErrors = <TField extends string>(
  issues: z.core.$ZodIssue[]
): Partial<Record<TField, string>> => {
  const fieldErrors: Partial<Record<TField, string>> = {};

  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in fieldErrors)) {
      fieldErrors[key as TField] = issue.message;
    }
  }

  return fieldErrors;
}

export const getMemberForEdit = async (mbrId: unknown): Promise<GetMemberForEditResult> => {
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden'};
  }

  const parsedId = MemberIdSchema.safeParse(mbrId);
  if (!parsedId.success) {
    return { success: false, message: 'Invalid member id.' };
  }

  const row = await prisma.member.findUnique({
    where: { mbr_id: parsedId.data },
    select: {
      mbr_id: true,
      name_kFull: true,
      name_eFirst: true,
      name_eLast: true,
      email: true,
      address: true,
      city: true,
      province: true,
      postal: true,
      note: true,
    },
  });

  if (!row) {
    return { success: false, message: 'Member not found.' }
  }

  return {
    success: true,
    member: {
      mbr_id: row.mbr_id,
      name_kFull: row.name_kFull,
      name_eFirst: row.name_eFirst,
      name_eLast: row.name_eLast,
      email: row.email,
      address: row.address,
      city: row.city,
      province: row.province,
      postal: row.postal,
      note: row.note,
    },
  };
};

export const updateMember = async (input: unknown): Promise<UpdateMemberResult> => {
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

  const parsed = UpdateMemberFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Invalid form values.',
      fieldErrors: buildFieldErrors<UpdateMemberField>(parsed.error.issues),
    };
  }

  const d = parsed.data;

  try {
    const existing = await prisma.member.findUnique({
      where: { mbr_id: d.mbr_id },
      select: { name_kFull: true },
    });

    if (!existing) {
      return { success: false, message: 'Member not found.' };
    }

    if (normalizeSpaces(existing.name_kFull) !== normalizeSpaces(d.name_kFull)) {
      return {
        success: false,
        message: 'name_kFull cannot be changed.',
        fieldErrors: {
          name_kFull: 'name_kFull is not editable.',
        },
      };
    }

    await prisma.member.update({
      where: { mbr_id: d.mbr_id },
      data: {
        name_eFirst: toNullableText(d.name_eFirst),
        name_eLast: toNullableText(d.name_eLast),
        email: toNullableText(d.email),
        address: toNullableText(d.address),
        city: toNullableText(d.city),
        province: toNullableText(d.province),
        postal: toNullableText(d.postal),
        note: toNullableText(d.note),
      },
    });

    revalidatePath(MEMBER_LIST_PATH);
    return { success: true };
  } catch (err) {
    if (isP2002(err)) {
      return {
        success: false,
        message: 'name_kFull already exists.',
        fieldErrors: {
          name_kFull: 'This name_kFull is already registered.',
        },
      };
    }

    console.error('updateMember error:', err);
    return { success: false, message: 'Failed to update member.' };
  }
};

export const deleteMember = async (mbrId: number): Promise<ActionOK | ActionFail> => {
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

  try {
    await prisma.member.delete({ where: { mbr_id: mbrId } });
    revalidatePath(MEMBER_LIST_PATH);
    return { success: true };
  } catch (err) {
    console.error('deleteMember error:', err);
    return {
      success: false,
      message: 'Failed to delete member. It may be referenced by income records.',
    };
  }
};

export const createMember = async (input: unknown): Promise<CreateMemberResult> => {
  if (!(await canAccessFinance())) {
    return { success: false, message: 'Forbidden' };
  }

  const parsed = CreateMemberFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Invalid form values.',
      fieldErrors: buildFieldErrors<CreateMemberField>(parsed.error.issues),
    };
  }

  const d = parsed.data;

  try {
    const created = await prisma.member.create({
      data: {
        name_kFull: d.name_kFull,
        name_eFirst: toNullableText(d.name_eFirst),
        name_eLast: toNullableText(d.name_eLast),
        email: toNullableText(d.email),
        address: toNullableText(d.address),
        city: toNullableText(d.city),
        province: toNullableText(d.province),
        postal: toNullableText(d.postal),
        note: toNullableText(d.note),
      },
      select: { mbr_id: true },
    });

    revalidatePath(MEMBER_LIST_PATH);
    return { success: true, memberId: created.mbr_id };
  } catch (err) {
    if (isP2002(err)) {
      return {
        success: false,
        message: 'Member already exists.',
        fieldErrors: {
          name_kFull: 'This name_kFull already exists.',
        },
      };
    }

    console.error('createMember error:', err);
    return { success: false, message: 'Database failure. Please try again.' };
  }
};
