import { Controller, Get } from '@nestjs/common';
import { CatalogsService } from '../modules/catalogs/catalogs.service.js';
import { Public } from '../modules/auth/public.decorator.js';

@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogs: CatalogsService) {}

  @Get()
  @Public()
  options() {
    return this.catalogs.options();
  }
}
