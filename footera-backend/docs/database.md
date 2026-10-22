# PostgreSQL et Prisma

Prisma est l’ORM du backend et PostgreSQL son moteur de stockage. Le schéma est `prisma/schema.prisma`, les migrations sont suivies dans `prisma/migrations`, et l’URL vient de `DATABASE_URL` (fichier `.env` en local, secret d’environnement en CI/production).

## Développement

```sh
docker compose up -d postgres
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
```

`db:migrate` sert au développement et peut créer une migration. En CI et sur les environnements déployés, utiliser `npm run db:deploy`, qui applique exclusivement les migrations commitées. Vérifier puis committer toute migration générée avec le code.

Le seed est défini dans `src/database/seed-data.ts` et `prisma/seed.mjs`. Il doit rester reproductible et ne contenir aucun secret ni donnée réelle. Ne jamais committer `.env`, une sauvegarde de base ou des identifiants ; `.env.example` ne contient que des valeurs locales de démonstration.
