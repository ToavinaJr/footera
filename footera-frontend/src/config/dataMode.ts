export const DATA_MODE = 'api' as const;

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api/v1';

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(`[Footera Core] Running in ${DATA_MODE.toUpperCase()} data mode. API base: ${API_BASE_URL}`);
}
