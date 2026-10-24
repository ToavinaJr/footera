# Footera

Footera est une plateforme de gestion de football amateur composée d’une interface React/Vite et d’une API NestJS utilisant Prisma et PostgreSQL.

## Prérequis

- Node.js 24 et npm
- Docker avec Docker Compose pour lancer PostgreSQL
- Git

## Démarrage local

1. Copier `footera-backend/.env.example` vers `footera-backend/.env` et `footera-frontend/.env.example` vers `footera-frontend/.env`.
2. Depuis `footera-backend`, démarrer PostgreSQL : `docker compose up -d postgres`.
3. Installer les dépendances dans `footera-backend` et `footera-frontend` avec `npm ci`.
4. Depuis `footera-backend`, exécuter `npm run db:generate`, `npm run db:deploy`, puis `npm run db:seed`.
5. Lancer `npm run start:dev` dans le backend, puis `npm run dev` dans le frontend.

L’interface est disponible sur [http://localhost:3001](http://localhost:3001), l’API sur [http://localhost:3000/api/v1](http://localhost:3000/api/v1). Vite relaie `/api` au backend en développement.

## Vérification

GitHub Actions exécute lint, tests, migrations/seed de test et builds pour les deux applications sur les pushs vers `main`/`master` et les pull requests. Voir [CI/CD](docs/ci-cd.md).

Un tag `vX.Y.Z` publie les images Docker frontend et backend dans GitHub Container Registry. Le déploiement vers un hébergeur précis restera à configurer une fois sa cible définie.

## Documentation

- [Architecture générale](docs/architecture.md) · [Audit technique](docs/technical-audit.md) · [Plan de refactorisation](docs/refactoring-plan.md) · [CI/CD et publication](docs/ci-cd.md)
- [Backend](footera-backend/README.md) · [architecture](footera-backend/docs/architecture.md) · [base de données](footera-backend/docs/database.md) · [déploiement](footera-backend/docs/deployment.md) · [changelog](footera-backend/CHANGELOG.md)
- [Frontend](footera-frontend/README.md) · [architecture](footera-frontend/docs/architecture.md) · [configuration](footera-frontend/docs/configuration.md) · [changelog](footera-frontend/CHANGELOG.md)
