export const DATA_MODE = 'api' as const;

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
export const API_BASE_URL = configuredApiBaseUrl || '/api/v1';

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(`[Footera Core] Running in ${DATA_MODE.toUpperCase()} data mode. API base: ${API_BASE_URL}`);
}
