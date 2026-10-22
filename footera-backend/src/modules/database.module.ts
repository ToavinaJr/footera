import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RecordRepository } from '../database/record.repository.js';
import { SeedService } from '../database/seed.service.js';
import { CatalogsService } from './catalogs/catalogs.service.js';

@Global()
@Module({
  providers: [PrismaService, RecordRepository, SeedService, CatalogsService],
  exports: [PrismaService, RecordRepository, SeedService, CatalogsService],
})
export class DatabaseModule {}
