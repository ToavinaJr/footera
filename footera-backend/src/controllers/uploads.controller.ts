import { BadRequestException, Body, Controller, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { MAX_IMAGE_SIZE, UploadsService } from '../modules/uploads/uploads.service.js';

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('images')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 1, parts: 2 },
    fileFilter: (_request, file, callback) => {
      if (!allowedMimeTypes.has(file.mimetype)) {
        callback(new BadRequestException('Format refusé. Seuls PNG, JPEG et WebP sont autorisés.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  uploadImage(
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
    @Body('purpose') purpose: string | undefined,
    @Req() request: Request,
  ) {
    return this.uploads.uploadImage(file, purpose, request.ip || 'unknown');
  }
}
