import { Module } from '@nestjs/common';
import { GalleriesController } from '../../controllers/galleries.controller.js';
import { DatabaseModule } from '../database.module.js';
import { AuthenticationModule } from '../auth/authentication.module.js';
import { GalleriesService } from './galleries.service.js';

@Module({ imports: [DatabaseModule, AuthenticationModule], controllers: [GalleriesController], providers: [GalleriesService] })
export class GalleriesModule {}
