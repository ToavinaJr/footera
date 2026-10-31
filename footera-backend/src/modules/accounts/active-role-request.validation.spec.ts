import { describe, expect, it } from 'vitest';
import { switchActiveRoleBodyPipe } from './active-role-request.validation.js';

describe('active role request validation', () => {
  it('accepts a role name for service-level authorization', () => {
    expect(switchActiveRoleBodyPipe.transform({ role: 'Entraîneur' }))
      .toEqual({ role: 'Entraîneur' });
  });

  it('rejects blank, oversized and unexpected fields', () => {
    expect(() => switchActiveRoleBodyPipe.transform({ role: ' ' })).toThrow();
    expect(() => switchActiveRoleBodyPipe.transform({ role: 'x'.repeat(81) })).toThrow();
    expect(() => switchActiveRoleBodyPipe.transform({ role: 'Entraîneur', userId: 'attacker' })).toThrow();
  });
});
