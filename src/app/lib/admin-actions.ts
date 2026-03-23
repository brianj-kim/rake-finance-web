'use server';

import bcrypt from 'bcryptjs';
import { Prisma, type AdminRole as LegacyAdminRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { requireSuperAdmin } from '@/app/lib/auth';
import { ROLE_CODES } from '@/app/lib/rbac';
import {
  ActionResult,
  AdminCreateSchema,
  AdminIdSchema,
  AdminRow,
  AdminUpdateSchema,
  RoleOption,
} from '@/app/lib/admin-definitions';

const ADMINS_PATH = '/admin/admins';
const CHARITY_PATH = '/admin/charity';
const CATEGORY_PATH = '/admin/category';

const isP2002 = (e: unknown) => 
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

const mapZodErrors = (err: {
  issues?: Array<{ path?: unknown[]; message?: string }>;
}) => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err?.issues ?? []) {
    const key = String(issue.path?.[0] ?? 'form');
    fieldErrors[key] = String(issue.message ?? 'Invalid value');
  }

  return fieldErrors;
};

const OptionalTrimmedString = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim();
    return normalized === '' ? undefined : normalized;
  }, z.string().max(max).optional());

const OptionalEmailSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}, z.string().email('Invalid email format.').max(80).optional());

const OptionalWebsiteSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}, z
  .string()
  .max(120)
  .refine((v) => /^https?:\/\//i.test(v), 'Use a full URL starting with http:// or https://.')
  .optional());

const OptionalAssetUrlSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}, z
  .string()
  .max(255)
  .refine(
    (v) => v.startsWith('/') || v.startsWith('data:image/') || /^https?:\/\//i.test(v),
    'Use an image URL (http/https), data URL, or root-relative path (/...).'
  )
  .optional());

const OptionalOrderSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().int().min(0).max(32767).optional());

const CharityProfileSchema = z.object({
  legalName: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(40),
  province: z.string().trim().min(1).max(20),
  postal: z.string().trim().min(1).max(7),
  registrationNo: z.string().trim().min(1).max(20),
  locationIssued: z.string().trim().min(1).max(60),
  authorizedSigner: z.string().trim().min(1).max(80),
  charityEmail: OptionalEmailSchema,
  charityPhone: OptionalTrimmedString(20),
  charityWebsite: OptionalWebsiteSchema,
  churchLogoUrl: OptionalAssetUrlSchema,
  authorizedSignature: OptionalAssetUrlSchema,
});

const CategoryRangeSchema = z.enum(['inc', 'imd']);
const CategoryCreateSchema = z.object({
  range: CategoryRangeSchema,
  name: z.string().trim().min(1).max(20),
  detail: OptionalTrimmedString(255),
  order: OptionalOrderSchema,
  isParent: z.preprocess((value) => value === 'on' || value === true || value === 'true', z.boolean()),
});

const CategoryUpdateSchema = CategoryCreateSchema.extend({
  id: z.coerce.number().int().positive(),
});

const CategoryDeleteSchema = z.object({
  id: z.coerce.number().int().positive(),
});

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
  await requireSuperAdmin({ nextPath: '/admin/admins' });

  return prisma.role.findMany({
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  });
};

export const listAdmins = async (): Promise<AdminRow[]> => {
  await requireSuperAdmin({ nextPath: '/admin/admins' });

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
  await requireSuperAdmin({ nextPath: '/admin/admins' });

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
  await requireSuperAdmin({ nextPath: '/admin/admins' });

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
  await requireSuperAdmin({ nextPath: '/admin/admins' });

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

export const getCharityProfile = async () => {
  await requireSuperAdmin({ nextPath: CHARITY_PATH });

  const row = await prisma.charityProfile.findUnique({ where: { id: 1 } });
  return row ?? {
    id: 1,
    legalName: '',
    address: '',
    city: '',
    province: '',
    postal: '',
    registrationNo: '',
    locationIssued: '',
    authorizedSigner: '',
    charityEmail: null,
    charityPhone: null,
    charityWebsite: null,
    churchLogoUrl: null,
    authorizedSignature: null,
  };
};

export const saveCharityProfile = async (formData: FormData): Promise<ActionResult> => {
  await requireSuperAdmin({ nextPath: CHARITY_PATH });

  const raw = Object.fromEntries(formData.entries());
  const parsed = CharityProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    await prisma.charityProfile.upsert({
      where: { id: 1 },
      update: {
        legalName: parsed.data.legalName,
        address: parsed.data.address,
        city: parsed.data.city,
        province: parsed.data.province,
        postal: parsed.data.postal,
        registrationNo: parsed.data.registrationNo,
        locationIssued: parsed.data.locationIssued,
        authorizedSigner: parsed.data.authorizedSigner,
        charityEmail: parsed.data.charityEmail ?? null,
        charityPhone: parsed.data.charityPhone ?? null,
        charityWebsite: parsed.data.charityWebsite ?? null,
        churchLogoUrl: parsed.data.churchLogoUrl ?? null,
        authorizedSignature: parsed.data.authorizedSignature ?? null,
      },
      create: {
        id: 1,
        legalName: parsed.data.legalName,
        address: parsed.data.address,
        city: parsed.data.city,
        province: parsed.data.province,
        postal: parsed.data.postal,
        registrationNo: parsed.data.registrationNo,
        locationIssued: parsed.data.locationIssued,
        authorizedSigner: parsed.data.authorizedSigner,
        charityEmail: parsed.data.charityEmail ?? null,
        charityPhone: parsed.data.charityPhone ?? null,
        charityWebsite: parsed.data.charityWebsite ?? null,
        churchLogoUrl: parsed.data.churchLogoUrl ?? null,
        authorizedSignature: parsed.data.authorizedSignature ?? null,
      },
    });

    revalidatePath(CHARITY_PATH);
    return { success: true };
  } catch (err) {
    console.error('saveCharityProfile error:', err);
    return { success: false, message: 'Failed to save charity profile.' };
  }
};

export type CategoryAdminRow = {
  id: number;
  range: string | null;
  name: string;
  detail: string | null;
  order: number | null;
  isParent: boolean | null;
  depth: string | null;
};

export const listCategories = async (): Promise<CategoryAdminRow[]> => {
  await requireSuperAdmin({ nextPath: CATEGORY_PATH });

  const rows = await prisma.category.findMany({
    orderBy: [{ range: 'asc' }, { order: 'asc' }, { ctg_id: 'asc' }],
    select: {
      ctg_id: true,
      range: true,
      name: true,
      detail: true,
      order: true,
      isParent: true,
      depth: true,
    },
  });

  return rows.map((row) => ({
    id: row.ctg_id,
    range: row.range ?? null,
    name: row.name,
    detail: row.detail ?? null,
    order: row.order ?? null,
    isParent: row.isParent ?? null,
    depth: row.depth ?? null,
  }));
};

export const createCategory = async (formData: FormData): Promise<ActionResult<{ id: number }>> => {
  await requireSuperAdmin({ nextPath: CATEGORY_PATH });

  const raw = Object.fromEntries(formData.entries());
  const parsed = CategoryCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const created = await prisma.category.create({
      data: {
        range: parsed.data.range,
        name: parsed.data.name,
        detail: parsed.data.detail ?? null,
        order: parsed.data.order ?? null,
        isParent: parsed.data.isParent,
      },
      select: { ctg_id: true },
    });

    revalidatePath(CATEGORY_PATH);
    revalidatePath('/income/list');
    revalidatePath('/income/list/create');
    return { success: true, id: created.ctg_id };
  } catch (err) {
    console.error('createCategory error:', err);
    return { success: false, message: 'Failed to create category.' };
  }
};

export const updateCategory = async (formData: FormData): Promise<ActionResult> => {
  await requireSuperAdmin({ nextPath: CATEGORY_PATH });

  const raw = Object.fromEntries(formData.entries());
  const parsed = CategoryUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: 'Validation failed.', fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    await prisma.category.update({
      where: { ctg_id: parsed.data.id },
      data: {
        range: parsed.data.range,
        name: parsed.data.name,
        detail: parsed.data.detail ?? null,
        order: parsed.data.order ?? null,
        isParent: parsed.data.isParent,
      },
    });

    revalidatePath(CATEGORY_PATH);
    revalidatePath('/income/list');
    revalidatePath('/income/list/create');
    return { success: true };
  } catch (err) {
    console.error('updateCategory error:', err);
    return { success: false, message: 'Failed to update category.' };
  }
};

export const deleteCategory = async (formData: FormData): Promise<ActionResult> => {
  await requireSuperAdmin({ nextPath: CATEGORY_PATH });

  const raw = Object.fromEntries(formData.entries());
  const parsed = CategoryDeleteSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: 'Invalid category id.' };
  }

  try {
    await prisma.category.delete({ where: { ctg_id: parsed.data.id } });
    revalidatePath(CATEGORY_PATH);
    revalidatePath('/income/list');
    revalidatePath('/income/list/create');
    return { success: true };
  } catch (err) {
    console.error('deleteCategory error:', err);
    return { success: false, message: 'Failed to delete category. It may be referenced by income records.' };
  }
};
