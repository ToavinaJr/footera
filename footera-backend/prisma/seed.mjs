import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedDatabase } from '../dist/database/seed-data.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required. Configure a PostgreSQL connection in .env.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const reset = process.env.RESET_DATABASE === 'true';

try {
  await prisma.$connect();
  await seedDatabase(prisma, { reset });
  console.log(reset ? 'Footera database reset and seeded.' : 'Footera seed completed. Existing records were preserved.');
} finally {
  await prisma.$disconnect();
}
