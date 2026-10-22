import { Module } from '@nestjs/common';
import { CatalogsController } from '../../controllers/catalogs.controller.js';
import { DatabaseModule } from '../database.module.js';

@Module({ imports: [DatabaseModule], controllers: [CatalogsController] })
export class CatalogsModule {}
