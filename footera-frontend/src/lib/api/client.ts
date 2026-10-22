import { API_BASE_URL } from '../../config/dataMode';
import { AppApiError } from './errors';

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('footera_auth_token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
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
  } catch (err: any) {
    if (err instanceof AppApiError) {
      throw err;
    }
    throw new AppApiError(
      err?.message || 'Impossible de joindre le serveur API Footera. Vérifiez votre connexion.',
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
