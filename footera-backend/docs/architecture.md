# Architecture backend

Le backend est une application NestJS organisée en modules. Les contrôleurs HTTP adaptent les requêtes/réponses, les services portent la logique métier et `PrismaService` fournit le client de base de données partagé. Les modules par domaine sont sous `src/modules`; les contrôleurs historiques sont regroupés sous `src/controllers`.

Le préfixe global est `/api/v1`. Les origines autorisées sont configurées par `FRONTEND_URL` (origines séparées par des virgules, sans slash final).

Les changements persistants doivent rester compatibles avec les contrats API : faire évoluer schéma et migration, puis adapter service et tests ensemble. Pour le détail Prisma, voir [database.md](database.md).
