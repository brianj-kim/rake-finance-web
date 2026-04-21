import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { isRoleCode, ROLE_CODES, type RoleCode } from '../src/app/lib/rbac';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run prisma seed.');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const roles: Array<{ code: RoleCode; name: string }> = [
  { code: ROLE_CODES.SUPER, name: 'Super Admin' },
  { code: ROLE_CODES.TREASURER, name: 'Treasurer' },
  { code: ROLE_CODES.PASTOR, name: 'Pastor' },
];

const permissions = [
  { code: 'admin.access', name: 'admin.access' },
  { code: 'admin.manage_admins', name: 'admin.manage_admins' },
  { code: 'admin.manage_charity', name: 'admin.manage_charity' },
  { code: 'admin.manage_categories', name: 'admin.manage_categories' },
  { code: 'income.read', name: 'income.read' },
  { code: 'income.create', name: 'income.create' },
  { code: 'income.update', name: 'income.update' },
  { code: 'income.delete', name: 'income.delete' },
  { code: 'member.read', name: 'member.read' },
  { code: 'member.create', name: 'member.create' },
  { code: 'member.update', name: 'member.update' },
  { code: 'member.delete', name: 'member.delete' },
  { code: 'receipt.read', name: 'receipt.read' },
  { code: 'receipt.generate', name: 'receipt.generate' },
  { code: 'receipt.update', name: 'receipt.update' },
  { code: 'receipt.delete', name: 'receipt.delete' },
] as const;

const financePermissionCodes = permissions
  .filter((permission) =>
    permission.code.startsWith('income.') ||
    permission.code.startsWith('member.') ||
    permission.code.startsWith('receipt.')
  )
  .map((permission) => permission.code);

const rolePermissionCodes: Record<RoleCode, readonly string[]> = {
  [ROLE_CODES.SUPER]: permissions.map((permission) => permission.code),
  [ROLE_CODES.TREASURER]: financePermissionCodes,
  [ROLE_CODES.PASTOR]: [],
};

const env = (key: string) => process.env[key]?.trim() ?? '';

const envBoolean = (key: string) => {
  const value = env(key).toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
};

const getBootstrapAdmin = () => {
  const email = env('BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
  const password = env('BOOTSTRAP_ADMIN_PASSWORD');
  const name = env('BOOTSTRAP_ADMIN_NAME') || null;
  const roleCode = env('BOOTSTRAP_ADMIN_ROLE') || ROLE_CODES.SUPER;
  const resetPassword = envBoolean('BOOTSTRAP_ADMIN_RESET_PASSWORD');

  if (!email && !password) return null;

  if (!email || !password) {
    throw new Error('Both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required.');
  }

  if (password.length < 8) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters.');
  }

  if (!isRoleCode(roleCode)) {
    throw new Error(`BOOTSTRAP_ADMIN_ROLE must be one of: ${Object.values(ROLE_CODES).join(', ')}.`);
  }

  return { email, password, name, roleCode, resetPassword };
};

const seedRoles = async () => {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, isSystem: true },
      create: { code: role.code, name: role.name, isSystem: true },
    });
  }
};

const seedPermissions = async () => {
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { name: permission.name },
      create: { code: permission.code, name: permission.name },
    });
  }
};

const seedRolePermissions = async () => {
  const [roleRows, permissionRows] = await Promise.all([
    prisma.role.findMany({ select: { id: true, code: true } }),
    prisma.permission.findMany({ select: { id: true, code: true } }),
  ]);

  const roleIdByCode = new Map(roleRows.map((role) => [role.code, role.id]));
  const permissionIdByCode = new Map(
    permissionRows.map((permission) => [permission.code, permission.id])
  );

  for (const [roleCode, permissionCodes] of Object.entries(rolePermissionCodes)) {
    const roleId = roleIdByCode.get(roleCode);
    if (!roleId) continue;

    for (const permissionCode of permissionCodes) {
      const permissionId = permissionIdByCode.get(permissionCode);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }
};

const seedBootstrapAdmin = async () => {
  const bootstrap = getBootstrapAdmin();

  if (!bootstrap) {
    console.log('No bootstrap admin env vars provided; skipped admin bootstrap.');
    return;
  }

  const role = await prisma.role.findUnique({
    where: { code: bootstrap.roleCode },
    select: { id: true },
  });

  if (!role) {
    throw new Error(`Bootstrap role not found: ${bootstrap.roleCode}`);
  }

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: bootstrap.email },
    select: { id: true },
  });

  const shouldSetPassword = !existingAdmin || bootstrap.resetPassword;
  const passwordHash = shouldSetPassword ? await bcrypt.hash(bootstrap.password, 12) : null;

  const admin = existingAdmin
    ? await prisma.admin.update({
        where: { email: bootstrap.email },
        data: {
          name: bootstrap.name,
          isActive: true,
          role: bootstrap.roleCode,
          ...(passwordHash ? { passwordHash } : {}),
        },
        select: { id: true },
      })
    : await prisma.admin.create({
        data: {
          email: bootstrap.email,
          name: bootstrap.name,
          passwordHash: passwordHash ?? '',
          isActive: true,
          role: bootstrap.roleCode,
        },
        select: { id: true },
      });

  await prisma.adminRoleAssignment.upsert({
    where: { adminId_roleId: { adminId: admin.id, roleId: role.id } },
    update: {},
    create: { adminId: admin.id, roleId: role.id },
  });

  console.log(
    existingAdmin && !bootstrap.resetPassword
      ? `Bootstrap admin ${bootstrap.email} updated without resetting password.`
      : `Bootstrap admin ${bootstrap.email} created or password reset.`
  );
};

async function main() {
  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  await seedBootstrapAdmin();

  console.log('RBAC seed completed.');
}

main()
  .catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Seed failed with Prisma error ${error.code}:`, error.message);
    } else {
      console.error('Seed failed:', error);
    }

    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
