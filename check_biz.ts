import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bookzydb?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const businesses = await prisma.business.findMany();
  console.log("Businesses:", businesses.map(b => ({ id: b.id, name: b.name })));

  for (const b of businesses) {
    const count = await prisma.booking.count({ where: { businessId: b.id } });
    console.log(`Business ${b.name} has ${count} bookings`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
