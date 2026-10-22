export type DataMode = 'mock' | 'api';

const rawMode = (import.meta.env.VITE_DATA_MODE as string | undefined)?.toLowerCase();

export const DATA_MODE: DataMode = rawMode === 'mock' ? 'mock' : 'api';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api/v1';

export const IS_MOCK_MODE = DATA_MODE === 'mock';

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(`[Footera Core] Running in ${DATA_MODE.toUpperCase()} data mode. API base: ${API_BASE_URL}`);
}
