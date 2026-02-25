import { z } from 'zod';

export type AdminRow = {
  id: number;
  email: string;
  name?: string | null;
  role?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CharityProfileDTO = {
  id: number;
  legalName: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  registrationNo: string;
  locationIssued: string;
  authorizedSigner: string;
};

export type CategoryAdminRow = {
  ctg_id: number;
  name: string;
  detail?: string | null;
  order?: number | null;
  range?: string | null;
  depth?: string | null;
  isParent?: boolean | null;
};

export type ActionOK<T extends object = object> = { success: true } & T;
export type ActionFail = { success: false; message: string; fieldErrors?: Record<string, string> };
export type ActionResult<T extends object = object> = ActionOK<T> | ActionFail;

export const AdminIdSchema = z.coerce.number().int().positive();

export const AdminCreateSchema = z.object({
   email: z.email({ message: "Invalid email." }).trim().toLowerCase(),
  name: z.string().trim().max(80).optional().nullable().or(z.literal("")),
  role: z.string().trim().max(20).optional().nullable().or(z.literal("")),
  password: z.string().min(8, "Min 8 characters."),
  isActive: z.coerce.boolean().optional(),
});

export const AdminUpdateSchema = z.object({
  id: AdminIdSchema,
  email: z.email({ message: "Invalid email." }).trim().toLowerCase(),
  name: z.string().trim().max(80).optional().nullable().or(z.literal("")),
  role: z.string().trim().max(20).optional().nullable().or(z.literal("")),
  password: z.string().optional().nullable().or(z.literal("")),
  isActive: z.coerce.boolean().optional(),
});

export const CharityProfileSchema = z.object({
  legalName: z.string().trim().min(2).max(120),
  address: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(40),
  province: z.string().trim().min(2).max(20),
  postal: z.string().trim().min(3).max(7),
  registrationNo: z.string().trim().min(2).max(20),
  locationIssued: z.string().trim().min(2).max(60),
  authorizedSigner: z.string().trim().min(2).max(80),
});

export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(20),
  detail: z.string().trim().max(255).optional().nullable().or(z.literal("")),
  range: z.string().trim().max(3).optional().nullable().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(32767).optional().nullable().or(z.literal("") as any),
});

export const CategoryUpdateSchema = CategoryCreateSchema.extend({
  ctg_id: z.coerce.number().int().positive(),
});