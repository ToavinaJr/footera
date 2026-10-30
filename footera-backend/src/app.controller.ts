import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './modules/auth/public.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @Public()
  getStatus() {
    return {
      name: 'Footera API',
      version: '1.0.0',
      status: 'operational',
      database: 'PostgreSQL (Prisma ORM)',
    };
  }
}
