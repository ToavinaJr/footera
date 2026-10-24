# Déploiement backend

L’image de `Dockerfile` écoute sur `PORT` (3000 par défaut) et nécessite `DATABASE_URL`. Configurer aussi `FRONTEND_URL` avec l’origine du frontend, sans slash final. Fournir ces valeurs via le gestionnaire de secrets de l’hébergeur.

Avant de démarrer la nouvelle version, appliquer les migrations depuis un job/outillage disposant des dépendances de développement du backend (`npm ci`, puis `npm run db:deploy`) contre la base cible. Le CLI Prisma n’est volontairement pas inclus dans l’image d’exécution. Exécuter la migration une seule fois par release, et non concurremment depuis chaque réplique. Les seeds sont destinés au développement/démonstration : le seed automatique et l’endpoint de synchronisation refusent maintenant `NODE_ENV=production`. Ne pas activer le seed de démo sur une base de production.

Les tags Git `vX.Y.Z` publient l’image `ghcr.io/<owner>/<repo>/backend`. Le workflow ne réalise pas de rollout automatique sur un hébergeur : voir la [documentation CI/CD du dépôt](../../docs/ci-cd.md).
