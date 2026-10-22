# Configuration frontend

Vite lit les variables `VITE_*` en développement et les incorpore au build. Toute valeur `VITE_*` est publique : n’y placer aucun secret.

| Variable | Valeur locale | Rôle |
| --- | --- | --- |
| `VITE_DATA_MODE` | `api` | `api` active les appels backend ; `mock` active les données de démonstration si elles sont disponibles. |
| `VITE_API_BASE_URL` | `/api/v1` | Préfixe des routes consommées par le client API. |
| `VITE_BACKEND_URL` | `http://localhost:3000` | Destination du proxy Vite `/api` en développement. |

En local, préférer l’URL relative `/api/v1` et le proxy Vite, avec le frontend sur le port 3001 et le backend sur 3000. Cela évite CORS. Si l’application appelle directement le backend depuis une autre origine, ajouter exactement cette origine (protocole, hôte et port, sans slash final) dans `FRONTEND_URL` côté backend.

Dans l’image Nginx, `BACKEND_URL` configure la destination du proxy `/api/` au démarrage du conteneur, par défaut `http://backend:3000`. Ne pas confondre variables Vite publiques et secrets serveur.
