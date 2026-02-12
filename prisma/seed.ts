import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const admins = [
    { email: 'jiwoone@gmail.com', password: '8ri@N9538!!', name: 'Jiwoun (Admin)' },
    { email: 'uofrcom@gmail.com', password: 'Jina12dasoam', name: 'Junkyu (Admin)' },
  ];

  for (const a of admins) {
    const passwordHash = await bcrypt.hash(a.password, 12);
    await prisma.admin.upsert({
      where: { email: a.email },
      update: { name: a.name, passwordHash, isActive: true },
      create: { email: a.email, name: a.name, passwordHash, isActive: true },
    });
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
