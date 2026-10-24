import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';

vi.mock('./seed-data.js', () => ({ seedDatabase: vi.fn().mockResolvedValue(undefined) }));

import { seedDatabase } from './seed-data.js';
import { SeedService } from './seed.service.js';

describe('SeedService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('does not apply demo fixtures in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const service = new SeedService({} as never);

    await service.onModuleInit();

    expect(seedDatabase).not.toHaveBeenCalled();
    expect(() => service.resetDemo()).toThrow(ForbiddenException);
    expect(seedDatabase).not.toHaveBeenCalled();
  });

  it('synchronizes demo fixtures outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const prisma = {} as never;
    const service = new SeedService(prisma);

    await service.onModuleInit();

    expect(seedDatabase).toHaveBeenCalledWith(prisma);
  });
});
