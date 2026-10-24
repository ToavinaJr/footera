import { Module } from '@nestjs/common';
import { GalleriesController } from '../../controllers/galleries.controller.js';
import { DatabaseModule } from '../database.module.js';
import { GalleriesService } from './galleries.service.js';

@Module({ imports: [DatabaseModule], controllers: [GalleriesController], providers: [GalleriesService] })
export class GalleriesModule {}
