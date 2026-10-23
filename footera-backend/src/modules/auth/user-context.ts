import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserContext {
  private readonly storage = new AsyncLocalStorage<string>();

  run<T>(userId: string, callback: () => T): T {
    return this.storage.run(userId, callback);
  }

  get userId(): string | undefined {
    return this.storage.getStore();
  }
}
