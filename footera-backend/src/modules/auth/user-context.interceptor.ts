import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserContext } from './user-context.js';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor(private readonly userContext: UserContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: { id: string } }>();
    const userId = request.user?.id;
    return userId
      ? new Observable((subscriber) => this.userContext.run(userId, () => next.handle().subscribe(subscriber)))
      : next.handle();
  }
}
