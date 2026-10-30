import { API_BASE_URL } from '../../config/dataMode';
import { AppApiError } from './errors';
import { parseSuccessfulResponse } from './response';

interface ApiErrorBody extends Record<string, unknown> {
  message?: string;
  code?: string;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

let refreshInFlight: Promise<boolean> | null = null;
let sessionExpiredEventSent = false;
const API_REQUEST_TIMEOUT_MS = 10_000;

function requestSignal(signal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('La requête API a dépassé le délai autorisé.')), API_REQUEST_TIMEOUT_MS);
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    },
  };
}

function notifySessionExpired() {
  if (sessionExpiredEventSent || typeof window === 'undefined') return;
  sessionExpiredEventSent = true;
  window.dispatchEvent(new Event('footera:session-expired'));
}

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    const refreshUrl = `${API_BASE_URL.replace(/\/$/, '')}/auth/refresh`;
    const request = requestSignal();
    refreshInFlight = fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      signal: request.signal,
    }).then((response) => response.ok).catch(() => false).finally(() => {
      request.cleanup();
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const request = requestSignal(options.signal ?? undefined);

  try {
    let response = await fetch(url, { ...options, headers, credentials: 'include', signal: request.signal });
    const authEndpoint = /^auth\/(login|register|logout|refresh)$/.test(endpoint.replace(/^\//, ''));
    if (response.status === 401 && !authEndpoint) {
      if (await refreshSession()) response = await fetch(url, { ...options, headers, credentials: 'include', signal: request.signal });
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

    return parseSuccessfulResponse<T>(response, API_BASE_URL);
  } catch (err: unknown) {
    if (err instanceof AppApiError) throw err;
    throw new AppApiError(
      err instanceof Error ? err.message : 'Impossible de joindre le serveur API Footera. Vérifiez votre connexion.',
      0,
      'NETWORK_OFFLINE',
    );
  } finally {
    request.cleanup();
  }
}
