# Architecture du projet

```text
Navigateur ── Vite (développement) / Nginx (conteneur) ── NestJS API ── PostgreSQL
```

- `footera-frontend` contient l’application React et ses clients API. Les appels sont préfixés par `/api/v1`.
- `footera-backend` expose l’API REST NestJS, valide les requêtes et délègue l’accès aux données à Prisma.
- PostgreSQL est le stockage persistant. Le schéma Prisma et les migrations versionnées sont la référence pour son évolution.
- En développement, Vite relaie `/api` vers `VITE_BACKEND_URL` (par défaut `http://localhost:3000`). Nginx relaie `/api/` vers `BACKEND_URL` dans l’image frontend.

Consulter les documentations propres à chaque application pour les conventions internes.
