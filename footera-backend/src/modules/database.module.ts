import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RecordRepository } from '../database/record.repository.js';
import { SeedService } from '../database/seed.service.js';

@Global()
@Module({
  providers: [PrismaService, RecordRepository, SeedService],
  exports: [PrismaService, RecordRepository, SeedService],
})
export class DatabaseModule {}
