import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Dispatch, SetStateAction } from 'react';

/** URL is the source of truth, including browser back/forward and deep links. */
export function useUrlState<T extends string | boolean>(key: string, fallback: T, allowed?: readonly T[]): [T, Dispatch<SetStateAction<T>>] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const parsed = raw === null ? fallback : typeof fallback === 'boolean' ? raw === 'true' : raw;
  const value = (allowed && !allowed.includes(parsed as T) ? fallback : parsed) as T;
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    setParams((current) => {
      const copy = new URLSearchParams(current);
      const previous = current.get(key);
      const previousValue = (previous === null ? fallback : typeof fallback === 'boolean' ? previous === 'true' : previous) as T;
      const resolved = typeof next === 'function' ? next(previousValue) : next;
      if (resolved === fallback) copy.delete(key);
      else copy.set(key, String(resolved));
      if (key !== 'page') copy.delete('page');
      return copy;
    }, { replace: key === 'query' || key === 'q' });
  }, [key, fallback, setParams]);
  return [value, setValue];
}
