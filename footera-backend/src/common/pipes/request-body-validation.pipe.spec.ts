import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { RequestBodyValidationPipe, validateRequestBody } from './request-body-validation.pipe.js';

describe('validateRequestBody', () => {
  it('accepts plain JSON objects and preserves their values', () => {
    const body = { pitchId: 'pitch-1', selections: [{ date: '2026-10-24', time: '07:00' }] };
    expect(validateRequestBody(body)).toBe(body);
  });

  it.each([null, 'string', 42, true, []])('rejects a non-object JSON body: %s', (body) => {
    expect(() => validateRequestBody(body)).toThrow(BadRequestException);
  });

  it('rejects unsafe property names, oversized collections, and excessive nesting', () => {
    const unsafe = JSON.parse('{"constructor":{"prototype":{"polluted":true}}}') as unknown;
    expect(() => validateRequestBody(unsafe)).toThrow(BadRequestException);
    expect(() => validateRequestBody({ list: Array.from({ length: 201 }, () => 'x') })).toThrow(BadRequestException);

    let nested: Record<string, unknown> = {};
    for (let index = 0; index < 13; index += 1) nested = { child: nested };
    expect(() => validateRequestBody(nested)).toThrow(BadRequestException);
  });

  it('leaves extracted @Body(field) values untouched and validates full bodies', () => {
    const pipe = new RequestBodyValidationPipe();
    expect(pipe.transform('role', { type: 'body', data: 'role', metatype: String })).toBe('role');
    expect(() => pipe.transform('invalid', { type: 'body', metatype: Object })).toThrow(BadRequestException);
    expect(pipe.transform(undefined, { type: 'body', metatype: Object })).toBeUndefined();
  });
});
