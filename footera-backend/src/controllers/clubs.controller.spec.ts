import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { ClubsController } from './clubs.controller.js';
import { IS_PUBLIC_ROUTE } from '../modules/auth/public.decorator.js';

describe('ClubsController', () => {
  it('requires an authenticated context for listing clubs and computing manager permissions', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_ROUTE, ClubsController.prototype.list)).not.toBe(true);
  });
});
