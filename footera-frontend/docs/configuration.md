# Configuration du frontend

Le frontend utilise exclusivement l’API du backend pour les données métier. Les valeurs `VITE_*` sont publiques et intégrées au build : n’y placez aucun secret.

| Variable | Valeur locale | Rôle |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | Préfixe des routes API consommées par le frontend. |
| `VITE_BACKEND_URL` | `http://localhost:3000` | Destination du proxy Vite `/api` en développement. |

En local, le frontend tourne sur le port `3001` et le backend sur `3000`. L’URL relative `/api/v1` passe par le proxy Vite et évite les problèmes CORS.

Dans l’image Nginx, `BACKEND_URL` configure le proxy `/api/` au démarrage du conteneur, par défaut `http://backend:3000`.
