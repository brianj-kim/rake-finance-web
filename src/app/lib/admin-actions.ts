'use server';

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/app/lib/prisma';
import {
  ActionResult,
  AdminCreateSchema,
  AdminIdSchema,
  AdminRow,
  AdminUpdateSchema,
} from '@/app/lib/admin-definitions';

const ADMINS_PATH = '/admin/adminss';

const isP2002 = (e: unknown) => 
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

const mapZodErrors = (err: any) => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err?.issues ?? []) {
    const key = String(issue.path?.[0] ?? 'form');
    fieldErrors[key] = issue.message;
  }

  return fieldErrors;
};

export const listAdmins = async (): Promise<AdminRow[]> => {
  const rows = await prisma.admin.findMany({
    orderBy: [{ isActive: 'desc'}, { createdAt: 'desc' }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows;
};

export const getAdminForEdit = async (
  id: unknown
): Promise<ActionResult<{ admin: AdminRow }>> => {
  const parsed = AdminIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: 'Invalid admin id.'};

  const row = await prisma.admin.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!row) return { success: false, message: 'Admin not found.'};

  return { success: true, admin: row };
}

export const createAdmin = async (
  formData: FormData
): Promise<ActionResult<{ id: number }>> => {
  const raw = Object.fromEntries(formData.entries());
  const parsed = AdminCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: 'Validation failed', fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const passwordHash = await bcrypt.hash(String(parsed.data.password), 10);

    const created = await prisma.admin.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name ? String(parsed.data.name).trim() : null,
        role: parsed.data.role ? String(parsed.data.role).trim() : 'admin',
        isActive: parsed.data.isActive ?? true,
        passwordHash,
      },
      select: { id: true },
    });

    revalidatePath(ADMINS_PATH);

    return { success: true, id: created.id };
  } catch (err) {
    if (isP2002(err)) return { success: false, message: 'Email already exists.', fieldErrors: { email: 'Email already exists.' } };
    
    return { success: false, message: 'Failed to create admin.' };
  }
};

export const updateAdmin = async (
  formData: FormData
): Promise<ActionResult> => {
  const raw = Object.fromEntries(formData.entries());
  const parsed = AdminUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, message: 'Validation failed,', fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const password = String(parsed.data.password ?? '').trim();

    await prisma.admin.update({
      where: { id: parsed.data.id },
      data: {
        email: parsed.data.email,
        name: parsed.data.name ? String(parsed.data.name).trim() : null,
        role: parsed.data.role ? String(parsed.data.role).trim() : 'admin',
        isActive: parsed.data.isActive ?? true,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });

    revalidatePath(ADMINS_PATH);
    revalidatePath(`/admin/admins/${parsed.data.id}/edit`);

    return { success: true };
  } catch (err) {
    if (isP2002(err)) return { success: false, message: 'Email alreadyt exists.', fieldErrors: { email: 'Email already exists.' } };

    return { success: false, message: 'Failed to update admin.' };
  }
};

export const deleteAdmin = async (id: unknown): Promise<ActionResult> => {
  const parsed = AdminIdSchema.safeParse(id);

  if (!parsed.success) return { success: false, message: 'Invalid amdin id.' };

  try {
    await prisma.admin.delete({ where: { id: parsed.data } });
    revalidatePath(ADMINS_PATH);

    return { success: true };
  } catch {
    return { success: false, message: 'Failed to delete admin.' };
  }
}