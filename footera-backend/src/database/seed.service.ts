import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { seedDatabase } from './seed-data.js';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (!(await this.prisma.userRecord.count())) await seedDatabase(this.prisma);
  }

  resetDemo() {
    return seedDatabase(this.prisma, { reset: true });
  }
}
