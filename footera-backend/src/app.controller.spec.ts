import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  it('exposes a public PostgreSQL status payload for deployment healthchecks', () => {
    expect(appController.getStatus()).toEqual({
      name: 'Footera API',
      version: '1.0.0',
      status: 'operational',
      database: 'PostgreSQL (Prisma ORM)',
    });
  });
});
