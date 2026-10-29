import { useUrlState } from './useUrlState';

export function useListPagination<T>(items: T[], pageSize = 12) {
  const [rawPage, setPage] = useUrlState<string>('page', '1');
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(totalPages, Math.max(1, Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : 1));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, totalPages, total: items.length, setPage: (value: number) => setPage(String(value)) };
}
