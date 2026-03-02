import { z } from 'zod';

export type AdminRow = {
  id: number;
  email: string;
  name?: string | null;
  roleCodes: string[]
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RoleOption = {
  id: number;
  code: string;
  name: string;
}

export type ActionOK<T extends object = object> = { success: true } & T;
export type ActionFail = { success: false; message: string; fieldErrors?: Record<string, string> };
export type ActionResult<T extends object = object> = ActionOK<T> | ActionFail;

export const AdminIdSchema = z.coerce.number().int().positive();
const RoleCodeSchema = z.string().trim().min(1).max(50);

const OptionalRoleCodeSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
    const normalized = value.trim();
    return normalized === '' ? undefined : normalized;  
}, RoleCodeSchema.optional());

export const AdminCreateSchema = z.object({
  email: z.email({ message: 'Invalid email.'}).trim().toLowerCase(),
  name: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  roleCode: OptionalRoleCodeSchema,
  password: z.string().min(8, 'Min 8 characters.'),
  isActive: z.coerce.boolean().optional(),
});

export const AdminUpdateSchema = z.object({
  id: AdminIdSchema,
  email: z.email({ message: 'Invalid email.' }).trim().toLowerCase(),
  name: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  roleCode: OptionalRoleCodeSchema,
  password: z.string().optional().nullable().or(z.literal('')),
  isActive: z.coerce.boolean().optional(),
});
