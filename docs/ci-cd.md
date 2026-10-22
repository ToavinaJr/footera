# CI/CD

## Intégration continue

`.github/workflows/ci.yml` s’exécute sur pull request, push vers `main` ou `master`, et lancement manuel. Le job backend démarre une base PostgreSQL éphémère, applique les migrations et le seed, puis lance lint, tests unitaires, tests e2e et build. Le job frontend lance le contrôle TypeScript et le build Vite.

## Publication des images

`.github/workflows/release.yml` construit et publie les images dans GHCR lorsqu’un tag `v*` est poussé :

```sh
git tag v1.0.0
git push origin v1.0.0
```

Le workflow utilise `GITHUB_TOKEN`. Le dépôt GitHub doit autoriser les workflows à écrire les packages. Les images sont publiées sous `ghcr.io/<propriétaire>/<dépôt>/backend` et `/frontend` avec tags de version et `latest`.

La publication d’images est automatisée, mais aucun rollout vers un serveur/cloud n’est configuré sans cible de déploiement connue. Pour activer le déploiement continu en production, il faut choisir la plateforme, son hôte API et son mécanisme de secrets/rollout ; aucun secret de production ne doit être commité.

## Images

Le backend écoute sur le port 3000 et exige `DATABASE_URL`. Les migrations doivent être appliquées une seule fois par release par un job/outillage disposant des dépendances de développement du backend (`npm ci`, puis `npm run db:deploy`) ; le CLI Prisma n’est pas embarqué dans l’image d’exécution allégée. Le frontend sert une SPA Nginx sur le port 80 ; `BACKEND_URL` configure son proxy API (par défaut `http://backend:3000`). Les conteneurs doivent partager un réseau permettant cette résolution DNS.
