export const DATA_MODE = 'api' as const;

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const defaultApiBaseUrl = import.meta.env.PROD
  ? 'https://footera-backend.vercel.app/api/v1'
  : '/api/v1';

// A relative API path in production can fall through to the SPA's index.html when a rewrite is missing.
// Use the known API origin by default for deployments; an explicit absolute VITE_API_BASE_URL overrides it.
export const API_BASE_URL = configuredApiBaseUrl && (!import.meta.env.PROD || /^https?:\/\//i.test(configuredApiBaseUrl))
  ? configuredApiBaseUrl
  : defaultApiBaseUrl;

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(`[Footera Core] Running in ${DATA_MODE.toUpperCase()} data mode. API base: ${API_BASE_URL}`);
}
