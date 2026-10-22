# Footera Frontend

Interface Footera développée avec React, TypeScript et Vite. Elle tourne par défaut sur `http://localhost:3001` et consomme l’API sous `/api/v1`.

Les sections disposent de leurs routes : `/`, `/players`, `/teams`, `/matches`, `/tournaments`, `/pitches`, `/recruitment`, `/marketplace`, `/profile` et `/stats`. Les fiches d’équipe, match, annonce de recrutement, terrain, article et tournoi ont des URLs dédiées. Les formulaires de création et l’édition du CV s’ouvrent aussi par URL ; les notifications sont accessibles via `/notifications` et leurs liens ouvrent la ressource concernée.

## Développement local

```sh
npm ci
npm run dev
```

Vite relaie `/api` vers `VITE_BACKEND_URL` (par défaut `http://localhost:3000`), évitant les requêtes cross-origin en développement. Démarrer le backend séparément. Copier `.env.example` vers `.env` pour ajuster le mode et l’URL API.

## Scripts

- `npm run lint` : vérification TypeScript (`tsc --noEmit`).
- `npm run build` : build Vite dans `dist/`.
- `npm run preview` : servir localement le build.

Voir [architecture](docs/architecture.md), [configuration](docs/configuration.md) et [changelog](CHANGELOG.md). L’image Nginx et le pipeline sont décrits dans [CI/CD](../docs/ci-cd.md).
