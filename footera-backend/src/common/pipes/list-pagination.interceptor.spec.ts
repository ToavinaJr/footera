import { describe, expect, it } from 'vitest';
import { paginateList } from './list-pagination.interceptor.js';

describe('Opt-in list pagination', () => {
  it('sorts before paging without mutating the original results', () => {
    const items = [{ id: 'b', price: 5 }, { id: 'a', price: 1 }, { id: 'c', price: 9 }];
    expect(paginateList(items, { page: '2', limit: '1', sort: 'price' })).toMatchObject({ data: [{ id: 'b', price: 5 }], total: 3, totalPages: 3 });
    expect(items[0].id).toBe('b');
  });
  it('rejects unbounded limits and malformed query types', () => {
    for (const query of [{ limit: '10000' }, { page: '-1' }, { page: ['1'] }, { sort: '__proto__' }]) expect(() => paginateList([], query)).toThrow();
    expect(paginateList([], { page: '1', limit: '12' }).data).toEqual([]);
  });
});
