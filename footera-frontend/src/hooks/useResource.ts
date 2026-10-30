import { useCallback, useEffect, useRef, useState } from 'react';

/** Only the newest request may update state. Refresh preserves existing content. */
export function useResource<T>(key: string, load: () => Promise<T>, initial: T, enabled = true) {
  const loader = useRef(load);
  loader.current = load;
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    setError(null);
    loader.current().then((result) => { if (active) setData(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason : new Error(String(reason))); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, enabled, revision]);
  return { data, setData, loading, error, refresh };
}
