# Footera Backend

API REST NestJS avec PostgreSQL et Prisma ORM. Le serveur écoute par défaut sur `http://localhost:3000` et expose les routes sous `/api/v1`.

## Démarrage local

1. Copier `.env.example` vers `.env` et vérifier `DATABASE_URL` et `FRONTEND_URL`.
2. Démarrer PostgreSQL : `docker compose up -d postgres`.
3. Installer les dépendances : `npm ci`.
4. Générer Prisma, appliquer les migrations et charger les données initiales :

   ```sh
   npm run db:generate
   npm run db:deploy
   npm run db:seed
   ```

5. Lancer le serveur avec `npm run start:dev`.

## Commandes utiles

| Commande | Usage |
| --- | --- |
| `npm run build` | Compiler NestJS |
| `npm run lint` | Vérifier le code avec Oxlint |
| `npm test` / `npm run test:e2e` | Tests unitaires / intégration |
| `npm run db:generate` | Régénérer le client Prisma |
| `npm run db:migrate` | Créer/appliquer une migration en développement |
| `npm run db:deploy` | Appliquer les migrations versionnées |
| `npm run db:seed` | Charger les données initiales |

Pour chaque changement de schéma, créer et valider une migration en développement, puis la committer dans `prisma/migrations`. Voir [architecture](docs/architecture.md), [base de données](docs/database.md), [déploiement](docs/deployment.md) et [changelog](CHANGELOG.md).
