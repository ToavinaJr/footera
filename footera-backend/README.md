# Footera Backend

API REST NestJS avec PostgreSQL et Prisma ORM. Le serveur écoute par défaut sur `http://localhost:3000` et expose les routes sous `/api/v1`.

## Démarrage local

1. Copier `.env.example` vers `.env` et vérifier `DATABASE_URL`, `FRONTEND_URL` et `JWT_SECRET`. Générer une clé avec `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
2. Démarrer PostgreSQL : `docker compose up -d postgres`.
3. Installer les dépendances : `npm ci`.
4. Générer Prisma, appliquer les migrations et charger les données initiales :

   ```sh
   npm run db:generate
   npm run db:deploy
   npm run db:seed
   ```

5. Lancer le serveur avec `npm run start:dev`.

## Authentification

Les routes métier nécessitent une session. `POST /api/v1/auth/register` crée un compte Joueur ou Supporter, `POST /api/v1/auth/login` ouvre une session, `POST /api/v1/auth/logout` la ferme et `GET /api/v1/auth/me` renvoie le profil courant. Les mots de passe sont dérivés avec `scrypt` et stockés séparément des profils dans `auth_credentials`, dont l’adresse e-mail normalisée est unique.

Configurez `JWT_SECRET` avec au moins 32 caractères aléatoires, différent pour chaque environnement. Le serveur refuse de démarrer en production si la clé manque. Le JWT d’accès expire après 15 minutes ; un jeton de renouvellement opaque, à usage unique et stocké sous forme de hash, permet une rotation de session pendant 7 jours. Les deux sont des cookies `HttpOnly`, `SameSite=Lax` et `Secure` en production. Le frontend renouvelle la session automatiquement. Configurez `FRONTEND_URL` avec l’origine exacte du frontend ; les requêtes d’écriture contrôlent aussi l’en-tête `Origin`.

Pour utiliser le compte de démonstration `alex.morel@footera.app`, définissez `SEED_USER_PASSWORD` (12 caractères minimum) avant `npm run db:seed`. Les rôles privilégiés du staff ne sont pas attribuables depuis le formulaire public. La vérification d’adresse e-mail et la récupération de compte restent à ajouter avant un lancement public. Configurez une limite de débit au niveau du proxy pour les routes d’inscription et de connexion.

## Images envoyées

L’API accepte les images PNG, JPEG et WebP de 5 Mo maximum via `POST /api/v1/uploads/images` (multipart : `file` et `purpose`). Elle vérifie le MIME et la signature binaire, refuse SVG et les images dépassant 20 mégapixels, génère un nom aléatoire et applique une limite de 20 uploads par adresse IP et par heure. Les images sont servies sous `/api/v1/uploads/` avec `nosniff` et CSP restrictive. `UPLOAD_DIR` configure le répertoire de stockage ; en production, montez-le sur un volume persistant.

Les tests de sécurité upload sont exécutés par `npm run test` : ils couvrent SVG, MIME falsifié, dépassement de taille, dimensions dangereuses, quota et autorisation de modification d’un logo. En production, configurez aussi des limites de débit au niveau du proxy et utilisez un stockage objet durable.

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
