import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  getStatus() {
    return {
      name: 'Footera API',
      version: '1.0.0',
      status: 'operational',
      database: 'SQLite (Prisma ORM)',
    };
  }
}
