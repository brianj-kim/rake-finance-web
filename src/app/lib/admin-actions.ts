'use server';

import bcrypt from 'bcryptjs';
import { Prisma, type AdminRole as LegacyAdminRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/app/lib/prisma';
import { requirePermission } from '@/app/lib/auth';
import { PERMISSIONS, ROLE_CODES } from '@/app/lib/rbac';
import {
  ActionResult,
  AdminCreateSchema,
  AdminIdSchema,
  AdminRow,
  AdminUpdateSchema,
  RoleOption,
} from '@/app/lib/admin-definitions';

const ADMINS_PATH = '/admin/admins';

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

const toLegacyAdminRole = (roleCode: string): LegacyAdminRole => {
  if (roleCode === ROLE_CODES.SUPER) return 'super';
  if (roleCode === ROLE_CODES.PASTOR) return 'pastor';
  
  return 'treasurer';
};

const mapAdminRow = (row: {
  id: number;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  adminRoles: Array<{ role: { code: string } }>;
}): AdminRow => ({
  id: row.id,
  email: row.email,
  name: row.name,
  roleCodes: row.adminRoles.map((r) => r.role.code),
  isActive: row.isActive,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const listRoles = async (): Promise<RoleOption[]> => {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_ADMINS, { nextPath: '/admin/admins' });

  return prisma.role.findMany({
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  });
};

export const listAdmins = async (): Promise<AdminRow[]> => {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_ADMINS, { nextPath: '/admin/admins' });

  const rows = await prisma.admin.findMany({
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      adminRoles: { select: { role: { select: { code: true } } } },      
    },
  });

  return rows.map(mapAdminRow);
};

export const createAdmin = async (formData: FormData): Promise<ActionResult<{ id: number }>> => {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_ADMINS, { nextPath: '/admin/admins' });

  const raw = Object.fromEntries(formData.entries());
  const parsed = AdminCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: 'Validation failed', fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const roleCode = parsed.data.roleCode ?? ROLE_CODES.TREASURER;
    const role = await prisma.role.findUnique({ where: { code: roleCode }, select: { id: true, code: true } } );
    if (!role) return { success: false, message: 'Invalid role code.', fieldErrors: { roleCode: 'Role not found.' } };

    const passwordHash = await bcrypt.hash(String(parsed.data.password), 10);

    const created = await prisma.admin.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name ? String(parsed.data.name).trim() : null,
        isActive: parsed.data.isActive ?? true,
        passwordHash,
        role: toLegacyAdminRole(role.code),
        adminRoles: { create: { roleId: role.id } },
      },
      select: { id: true },
    });

    revalidatePath(ADMINS_PATH);
    return { success: true, id: created.id };
  } catch (err) {
    if (isP2002(err)) return { success: false, message: 'Email already exists.', fieldErrors: { email: 'Email alreadyt exists.' } };
    return { success: false, message: 'Failed to create admin.' };
  }
};

export const updateAdmin = async (formData: FormData): Promise<ActionResult> => {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_ADMINS, { nextPath: '/admin/admins' });

  const raw = Object.fromEntries(formData.entries());
  const parsed = AdminUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const roleCode = parsed.data.roleCode ?? ROLE_CODES.TREASURER;
    const role = await prisma.role.findUnique({ where: { code: roleCode }, select: { id: true, code: true } });
    if (!role) return { success: false, message: 'Invalid role code.', fieldErrors: { roleCode: 'Role not found.' } };

    const password = String(parsed.data.password ?? '').trim();

    await prisma.admin.update({
      where: { id: parsed.data.id },
      data: {
        email: parsed.data.email,
        name: parsed.data.name ? String(parsed.data.name).trim() : null,
        isActive: parsed.data.isActive ?? true,
        role: toLegacyAdminRole(role.code),
        adminRoles: {
          deleteMany: {},
          create: { roleId: role.id },
        },
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });

    revalidatePath(ADMINS_PATH);
    return { success: true };
  } catch (err) {
    if (isP2002(err)) return { success: false, message: 'Email already exists.', fieldErrors: { email: 'Email already exists.' } };
    return { success: false, message: 'Failed to update admin.' };
  }
};

export const deleteAdmin = async (id: unknown): Promise<ActionResult> => {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_ADMINS, { nextPath: '/admin/admins' });

  const parsed = AdminIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: 'Invalid admin id.' };

  try {
    await prisma.admin.delete({ where: { id: parsed.data } });
    revalidatePath(ADMINS_PATH);

    return { success: true };
  } catch {
    return { success: false, message: 'Failed to delete admin.' };
  }
};
