import { API_BASE_URL } from '../../config/dataMode';
import { AppApiError } from './errors';

interface ApiErrorBody extends Record<string, unknown> {
  message?: string;
  code?: string;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

let refreshInFlight: Promise<boolean> | null = null;
let sessionExpiredEventSent = false;

function notifySessionExpired() {
  if (sessionExpiredEventSent || typeof window === 'undefined') return;
  sessionExpiredEventSent = true;
  window.dispatchEvent(new Event('footera:session-expired'));
}

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    const refreshUrl = `${API_BASE_URL.replace(/\/$/, '')}/auth/refresh`;
    refreshInFlight = fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }).then((response) => response.ok).catch(() => false).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  try {
    let response = await fetch(url, { ...options, headers, credentials: 'include' });
    const authEndpoint = /^auth\/(login|register|logout|refresh)$/.test(endpoint.replace(/^\//, ''));
    if (response.status === 401 && !authEndpoint) {
      if (await refreshSession()) response = await fetch(url, { ...options, headers, credentials: 'include' });
      if (response.status === 401) notifySessionExpired();
    }
    if (authEndpoint && response.ok) sessionExpiredEventSent = false;

    if (!response.ok) {
      let errorData: ApiErrorBody = {};
      try {
        const payload: unknown = await response.json();
        if (isApiErrorBody(payload)) errorData = payload;
      } catch {
        errorData = { message: response.statusText };
      }
      throw new AppApiError(
        errorData.message || `HTTP ${response.status}: Une erreur est survenue`,
        response.status,
        errorData.code || 'API_REQUEST_FAILED',
        errorData,
      );
    }

    if (response.status === 204) return {} as T;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const body = (await response.text()).slice(0, 160);
      throw new AppApiError(
        `L’API a renvoyé une réponse non JSON (${response.status}). Vérifiez que le backend répond sur ${API_BASE_URL}. ${body}`,
        response.status,
        'INVALID_API_RESPONSE',
      );
    }
    return await response.json() as T;
  } catch (err: unknown) {
    if (err instanceof AppApiError) throw err;
    throw new AppApiError(
      err instanceof Error ? err.message : 'Impossible de joindre le serveur API Footera. Vérifiez votre connexion.',
      0,
      'NETWORK_OFFLINE',
    );
  }
}
