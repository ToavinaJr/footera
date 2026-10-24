import { AppApiError } from './errors';

export async function parseSuccessfulResponse<T>(response: Response, apiBaseUrl: string): Promise<T> {
  if (response.status === 204) return {} as T;
  const body = await response.text();
  try {
    // JSON can legally be a primitive (e.g. `true`), even when a server labels it text/plain.
    return JSON.parse(body) as T;
  } catch {
    const excerpt = body.slice(0, 160);
    const isHtml = /<\s*!doctype\s+html|<\s*html[\s>]/i.test(body)
      || response.headers.get('content-type')?.toLowerCase().includes('text/html') === true;
    throw new AppApiError(
      isHtml
        ? `L’API ${apiBaseUrl} a renvoyé une page HTML (${response.status}) au lieu de JSON. Vérifiez l’URL de déploiement du backend et son routage /api/v1.`
        : `L’API a renvoyé une réponse non JSON (${response.status}). Vérifiez que le backend répond sur ${apiBaseUrl}. ${excerpt}`,
      response.status,
      isHtml ? 'API_ROUTE_RETURNED_HTML' : 'INVALID_API_RESPONSE',
    );
  }
}
