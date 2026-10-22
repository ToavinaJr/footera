import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { seedDatabase } from './seed-data.js';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Seed inserts missing fixtures without overwriting records already stored in PostgreSQL.
    // Running this on every startup also applies additions to existing demo databases.
    await seedDatabase(this.prisma);
  }

  resetDemo() {
    return seedDatabase(this.prisma, { reset: true });
  }
}
