'use server'

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { normalizeSpaces, normalizePostal } from '@/lib/utils';
import { prisma } from './prisma';
import { EditMemberDTO } from './definitions';

const MEMBER_LIST_PATH = '/income/member';

type ActionOK<T extends object = {}> = { success: true } & T;
type ActionFail = { success: false; message: string; fieldErrors?: Record<string, string> };
type ActionResult<T extends object = {}> = ActionOK<T> | ActionFail;

const isP2002 = (e: unknown) => 
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

const MemberIdSchema = z.coerce.number().int().positive();

export const getMemberForEdit = async (mbrId: unknown): Promise<ActionResult<{ member: EditMemberDTO }>> => {
  const parsedId = MemberIdSchema.safeParse(mbrId);
  if (!parsedId.success) return { success: false, message: 'Invalid member id.' };

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
      note: true
    }
  });

  if (!row) return { success: false, message: 'Member not found.' };

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
      note: row.note
    }
  }
}

const UpdateMemberSchema = z.object({
  mbr_id: z.coerce.number().int().positive(),

  name_kFull: z
    .string()
    .transform(normalizeSpaces)
    .refine((v) => v.length > 0, "name_kFull is required.")
    .refine((v) => v.length <= 50, "Max 50 characters."),

  name_eFirst: z.string().trim().max(30).optional().nullable().or(z.literal('')),
  name_eLast: z.string().trim().max(30).optional().nullable().or(z.literal('')),
  email: z.email('Invalid email.').optional().nullable().or(z.literal('')),
  address: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  city: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  province: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  postal: z
      .string()
      .transform((v) => (v ? normalizePostal(v) : v))
      .refine((v) => !v || v.length <= 7, 'Max 7 characters.')
      .optional()
      .nullable()
      .or(z.literal('')),
  note: z.string().trim().max(255).optional().nullable().or(z.literal(''))
});

export const updateMember = async (input: unknown): Promise<ActionResult> => {
  const parsed = UpdateMemberSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] = issue.message;
    }
    return { success: false, message: 'Invalid form values.', fieldErrors };
  }

  const d = parsed.data;

  const data = {
    name_eFirst: d.name_eFirst?.trim() ? d.name_eFirst.trim() : null,
    name_eLast: d.name_eLast?.trim() ? d.name_eLast.trim() : null,
    email: d.email?.trim() ? d.email.trim() : null,
    address: d.address?.trim() ? d.address.trim() : null,
    city: d.city?.trim() ? d.city.trim() : null,
    province: d.province?.trim() ? d.province.trim() : null,
    postal: d.postal?.trim() ? d.postal.trim() : null,
    note: d.note?.trim() ? d.note.trim() : null
  };

  try {
    const existing = await prisma.member.findUnique({
      where: { mbr_id: d.mbr_id },
      select: { name_kFull: true }
    });

    if (!existing) {
      return { success: false, message: 'Member not found.'};
    }

    if (normalizeSpaces(existing.name_kFull) !== normalizeSpaces(d.name_kFull)) {
      return {
        success: false,
        message: 'name_kFull cannot be changed.',
        fieldErrors: { name_kFull: 'name_kFull is not editable.' }
      };
    }

    await prisma.member.update({
      where: { mbr_id: d.mbr_id },
      data,
    });

    revalidatePath(MEMBER_LIST_PATH);
    return { success: true };
  } catch (err) {
    if (isP2002(err)) {
      return {
        success: false,
        message: 'name_kFull already exists.',
        fieldErrors: { name_kFull: 'This name_kFull is already registered.'}
      };
    }

    console.error('updateMember error:', err);
    return { success: false, message: 'Failed to update member.' };
  }
};

export const deleteMember = async (mbrId: number): Promise<ActionResult> => {
  try {
    await prisma.member.delete({ where: { mbr_id: mbrId } });
    revalidatePath(MEMBER_LIST_PATH);
    return { success: true };
  } catch (err) {
    console.error('deleteMember error:', err);
    return { success: false, message: 'Failed to delete member. It may be referenced by income records.' };
  }
};

const CreateMemberSchema = z.object({
  name_kFull: z
        .string()
        .transform(normalizeSpaces)
        .refine((v) => v.length > 0, 'name_kFull is required.')
        .refine((v) => v.length <= 50, 'Max 50 characters.'),

  name_eFirst: z.string().trim().max(30).optional().nullable().or(z.literal('')),
  name_eLast: z.string().trim().max(30).optional().nullable().or(z.literal('')),

  email: z.string().trim().max(80).email('Invaild Email.').optional().nullable().or(z.literal('')),
  address: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  city: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  province: z.string().trim().max(20).optional().nullable().or(z.literal('')),

  postal: z
    .string()
    .transform((v) => (v ? normalizePostal(v) : v))
    .refine((v) => !v || v.length <= 7, 'Max 7 characters.')
    .optional()
    .nullable()
    .or(z.literal('')),

  note: z
    .string().trim().max(255).optional().nullable().or(z.literal(''))
});

export const createMember = async (input: unknown): Promise<ActionResult<{ memberId: number}>> => {
  const parsed = CreateMemberSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] = issue.message;
    }
    return { success: false, message: 'Invalid form values.', fieldErrors };
  }

  const d = parsed.data;

  const data = {
    name_kFull: d.name_kFull,
    name_eFirst: d.name_eFirst?.trim() ? d.name_eFirst.trim() : null,
    name_eLast: d.name_eLast?.trim() ? d.name_eLast.trim() : null,
    email: d.email?.trim() ? d.email.trim() : null,
    address: d.address?.trim() ? d.address.trim() : null,
    city: d.city?.trim() ? d.city.trim() : null,
    province: d.province?.trim() ? d.province.trim() : null,
    postal: d.postal?.trim() ? d.postal.trim() : null
  };

  try {
    const created = await prisma.member.create({
      data,
      select: { mbr_id: true }
    });

    revalidatePath(MEMBER_LIST_PATH);
    return { success: true, memberId: created.mbr_id };
  } catch (err) {
    if (isP2002(err)) {
      return {
        success: false,
        message: 'Member already exists.',
        fieldErrors: { name_kFull: 'This name_kFull already exists.' }
      };
    }

    console.error('createMember error:', err);
    return { success: false, message: 'Database failure. Pleases try again.'};
  } 
};
