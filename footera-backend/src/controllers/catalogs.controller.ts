import { Controller, Get } from '@nestjs/common';
import { CatalogsService } from '../modules/catalogs/catalogs.service.js';

@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogs: CatalogsService) {}

  @Get()
  options() {
    return this.catalogs.options();
  }
}
