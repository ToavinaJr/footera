import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required. Configure a PostgreSQL connection in .env.');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    this.logger.log(JSON.stringify({ event: 'prisma:connect:start', databaseUrlConfigured: Boolean(process.env.DATABASE_URL) }));
    try {
      await this.$connect();
      this.logger.log(JSON.stringify({ event: 'prisma:connect:ready' }));
    } catch (error: unknown) {
      const details = {
        event: 'prisma:connect:failed',
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
      };
      this.logger.error(JSON.stringify(details), error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
