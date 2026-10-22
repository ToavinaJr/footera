import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateImageUrl } from './image-url.validation.js';

describe('uploaded image URL validation', () => {
  it('accepts Footera-generated paths and the existing HTTPS image preset host', () => {
    expect(validateImageUrl('/api/v1/uploads/8c82b450-a0fa-4fe1-a431-e8f98d483caa.webp'))
      .toContain('/api/v1/uploads/');
    expect(validateImageUrl('https://images.unsplash.com/photo/example.jpg')).toContain('images.unsplash.com');
  });

  it.each(['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'https://evil.example/image.png', '//evil.example/image.png'])
    ('rejects untrusted image URL %s', (url) => {
      expect(() => validateImageUrl(url)).toThrow(BadRequestException);
    });
});
