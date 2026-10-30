export const DATA_MODE = 'api' as const;

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

// Vercel must call the API through the frontend rewrite. This keeps the
// request same-origin and avoids relying on backend CORS for browser calls.
const isVercelFrontend = typeof window !== 'undefined'
  && window.location.hostname.endsWith('.vercel.app');

export const API_BASE_URL = isVercelFrontend ? '/api/v1' : (configuredApiBaseUrl || '/api/v1');

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(`[Footera Core] Running in ${DATA_MODE.toUpperCase()} data mode. API base: ${API_BASE_URL}`);
}
