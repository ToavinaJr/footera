# Déploiement Vercel

## Entrée de l’application

Vercel utilise [`src/index.ts`](../src/index.ts) comme fonction serverless NestJS. Cette entrée importe directement `NestFactory`, initialise l’application une seule fois par instance et transmet les requêtes à l’adaptateur Express.

[`src/main.ts`](../src/main.ts) reste l’entrée du serveur long-lived utilisée en local et dans l’image Docker. Il ne faut pas configurer Vercel pour exécuter directement `dist/main.js` comme fonction serverless, car cette entrée appelle `app.listen()`.

Le répertoire racine du projet Vercel doit être `footera-backend`.

## Variables Production

Configurer au minimum les variables suivantes dans Vercel :

- `DATABASE_URL` : URL PostgreSQL compatible avec `@prisma/adapter-pg` (`postgresql://` ou `postgres://`).
- `JWT_SECRET` : clé aléatoire d’au moins 32 caractères.
- `FRONTEND_URL` : origine exacte du frontend, sans slash final.
- `TRUST_PROXY_HOPS` : nombre exact de reverse proxies de confiance, généralement `0`.
- `UPLOAD_DIR` : répertoire des uploads si les uploads sont activés.

Le backend lit explicitement `DATABASE_URL`. `POSTGRES_URL` et `PRISMA_DATABASE_URL` ne la remplacent pas.

## Build

Le build de production exécute `npm run vercel-build`. Ce script applique les migrations avec `npm run db:deploy`, puis compile NestJS. Les migrations doivent être présentes dans `prisma/migrations`.

Un build réussi doit contenir notamment :

```text
No pending migrations to apply.
Generated Prisma Client
```

## Diagnostic

Pour une erreur de build `No entrypoint found which imports nestjs`, vérifier que `src/index.ts` importe directement `NestFactory` et `AppModule`.

Pour une erreur runtime, rechercher dans les logs Vercel les événements produits par le logger NestJS :

```text
bootstrap:failed
prisma:connect:failed
```

Les événements `prisma:connect:failed` indiquent généralement une URL `DATABASE_URL` incorrecte, une base inaccessible ou une configuration SSL manquante.
