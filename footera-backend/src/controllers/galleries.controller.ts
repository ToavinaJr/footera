import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { Public } from '../modules/auth/public.decorator.js';
import { GalleriesService, type GalleryEntity } from '../modules/galleries/galleries.service.js';
import {
  addGalleryImageBodyPipe,
  removeGalleryImageBodyPipe,
  replaceGalleryImageBodyPipe,
} from '../modules/galleries/gallery-request.validation.js';

const entities = new Set<GalleryEntity>(['players', 'clubs', 'pitches', 'tournaments']);

@Controller('galleries')
export class GalleriesController {
  constructor(private readonly galleries: GalleriesService) {}

  @Get(':entity/:id')
  @Public()
  get(@Param('entity') entity: string, @Param('id') id: string) {
    return this.galleries.get(this.parseEntity(entity), id);
  }

  @Post(':entity/:id')
  add(@Param('entity') entity: string, @Param('id') id: string, @Body(addGalleryImageBodyPipe) body: { imageUrl: string }) {
    return this.galleries.add(this.parseEntity(entity), id, body.imageUrl);
  }

  @Put(':entity/:id')
  replace(@Param('entity') entity: string, @Param('id') id: string, @Body(replaceGalleryImageBodyPipe) body: { previousImageUrl: string; imageUrl: string }) {
    return this.galleries.replace(this.parseEntity(entity), id, body.previousImageUrl, body.imageUrl);
  }

  @Delete(':entity/:id')
  remove(@Param('entity') entity: string, @Param('id') id: string, @Body(removeGalleryImageBodyPipe) body: { imageUrl: string }) {
    return this.galleries.remove(this.parseEntity(entity), id, body.imageUrl);
  }

  private parseEntity(value: string): GalleryEntity {
    if (entities.has(value as GalleryEntity)) return value as GalleryEntity;
    throw new BadRequestException('Type de galerie invalide.');
  }
}
