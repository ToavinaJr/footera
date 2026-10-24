import { AppApiError } from './errors';

export async function parseSuccessfulResponse<T>(response: Response, apiBaseUrl: string): Promise<T> {
  if (response.status === 204) return {} as T;
  const body = await response.text();
  try {
    // JSON can legally be a primitive (e.g. `true`), even when a server labels it text/plain.
    return JSON.parse(body) as T;
  } catch {
    const excerpt = body.slice(0, 160);
    throw new AppApiError(
      `L’API a renvoyé une réponse non JSON (${response.status}). Vérifiez que le backend répond sur ${apiBaseUrl}. ${excerpt}`,
      response.status,
      'INVALID_API_RESPONSE',
    );
  }
}
