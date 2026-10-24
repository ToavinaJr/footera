import { BadRequestException, Body, Controller, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { Public } from '../modules/auth/public.decorator.js';
import { MAX_IMAGE_SIZE, UploadsService } from '../modules/uploads/uploads.service.js';

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Get(':filename')
  @Public()
  async getImage(@Param('filename') filename: string, @Res() response: Response) {
    const image = await this.uploads.getImage(filename);
    response.set({
      'Content-Type': image.mimeType,
      'Content-Length': String(image.buffer.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });
    response.send(image.buffer);
  }

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
