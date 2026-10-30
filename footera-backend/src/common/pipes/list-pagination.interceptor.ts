import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';

/** Opt-in envelope: existing clients continue receiving arrays without page/limit. */
export function paginateList(items: unknown[], query: Record<string, unknown>) {
  const number = (key: string, fallback: number, max: number) => {
    if (query[key] === undefined) return fallback;
    if (typeof query[key] !== 'string' || !/^\d+$/.test(query[key] as string)) throw new BadRequestException(`${key} invalide.`);
    const value = Number(query[key]);
    if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new BadRequestException(`${key} invalide.`);
    return value;
  };
  const page = number('page', 1, 1_000_000);
  const limit = number('limit', 12, 100);
  const sorted = [...items];
  if (query.sort !== undefined) {
    if (!['name', 'title', 'price', 'createdAt', 'scheduledAt', 'startDate'].includes(String(query.sort))) throw new BadRequestException('Tri invalide.');
    const field = String(query.sort);
    sorted.sort((a, b) => {
      const left = (a as Record<string, unknown>)[field];
      const right = (b as Record<string, unknown>)[field];
      const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left ?? '').localeCompare(String(right ?? ''));
      return (query.order === 'desc' ? -result : result) || String((a as { id?: string }).id).localeCompare(String((b as { id?: string }).id));
    });
  }
  return { data: sorted.slice((page - 1) * limit, page * limit), page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) };
}

@Injectable()
export class ListPaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<{ method: string; originalUrl: string; query: Record<string, unknown> }>();
    const path = request.originalUrl.split('?')[0];
    const enabled = request.method === 'GET' && /\/(?:players|teams|clubs|matches|tournaments|pitches|marketplace|recruitment\/ads(?:\/available)?)\/?$/.test(path)
      && (request.query.page !== undefined || request.query.limit !== undefined);
    return next.handle().pipe(map((value: unknown) => enabled && Array.isArray(value) ? paginateList(value, request.query) : value));
  }
}
