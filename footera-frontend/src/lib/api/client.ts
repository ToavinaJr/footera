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
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const authEndpoint = /^auth\/(login|register|logout|refresh)$/.test(endpoint.replace(/^\//, ''));
    if (response.status === 401 && !authEndpoint && await refreshSession()) {
      response = await fetch(url, { ...options, headers, credentials: 'include' });
    }

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
        errorData
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const body = (await response.text()).slice(0, 160);
      throw new AppApiError(
        `L’API a renvoyé une réponse non JSON (${response.status}). Vérifiez que le backend répond sur ${API_BASE_URL}. ${body}`,
        response.status,
        'INVALID_API_RESPONSE'
      );
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof AppApiError) {
      throw err;
    }
    throw new AppApiError(
      err instanceof Error ? err.message : 'Impossible de joindre le serveur API Footera. Vérifiez votre connexion.',
      0,
      'NETWORK_OFFLINE'
    );
  }
}

/**
 * Standard simulated asynchronous delay for mock adapters.
 * Returns structured cloned data to prevent mutation pollution.
 */
export async function mockDelay<T>(data: T, delayMs = 300, failureRate = 0): Promise<T> {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (failureRate > 0 && Math.random() < failureRate) {
    throw new AppApiError('Erreur de simulation réseau (mode démo)', 503, 'SIMULATED_FAILURE');
  }

  return structuredClone(data);
}
