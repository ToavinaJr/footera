import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { seedDatabase } from './seed-data.js';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') return;
    // Demo fixtures are synchronized only in non-production environments.
    await seedDatabase(this.prisma);
  }

  resetDemo() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('La synchronisation des données de démonstration est désactivée en production.');
    }
    // Synchronize canonical demo records without deleting users or records created in the database.
    return seedDatabase(this.prisma);
  }
}
