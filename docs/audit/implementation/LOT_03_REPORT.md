# Rapport Lot 03 — E2E backend sur l'application composée

**Statut : NEEDS_REVIEW** · **BL-02 : implémenté, validation CI en attente**

## Changements

- Remplacement du test minimal qui instançait uniquement `AppController`/`AppService` et vérifiait « Hello World ».
- Le test utilise maintenant `createApp()` et l'`AppModule` réel, donc les modules Nest, préfixe global, validation et garde globale sont chargés.
- Deux scénarios : `GET /api/v1/status` répond avec l'état de l'API; `GET /api/v1/auth/me` sans session est refusé en 401.
- Les tests sont conditionnés à `CI=true`. Le workflow CI utilise un PostgreSQL éphémère, exécute migrations et seed avant les E2E. Garde de présence `DATABASE_URL` avant le démarrage.

## Validation réalisée

- `npm run test:e2e` local : commande verte, 2 fichiers et 3 tests ignorés car `CI` est absent; aucun accès DB effectué.
- `npm run lint` : réussi.
- `npm run build` : réussi.
- L'exécution réelle du test composé reste nécessaire dans CI pour confirmer la connexion PostgreSQL, la disponibilité du seed et les statuts HTTP attendus.

## Périmètre et sûreté

- Aucun changement de schéma ou migration.
- Aucun déploiement et aucun accès à la base de production.
- Les E2E ne doivent être exécutés qu'avec la base CI isolée; ne pas définir `CI=true` localement si `DATABASE_URL` vise une base partagée.

## Suite proposée

Ajouter progressivement les scénarios d'authentification et d'équipes via le même bootstrap, avec fixtures propres à l'exécution, nettoyage explicite, et vérifications d'autorisation. Ne pas considérer BL-02 terminé avant le résultat de la CI.
