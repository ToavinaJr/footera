# Stratégie de tests

## État vérifié

| Couche | État/résultat de l'audit | Limite |
|---|---|---|
| Frontend unit | `npm run lint` et `npm run test:unit` réussis après ajout de 4 tests i18n; tests couvrent API response, upload, dates, routes, parité FR/EN/MG, placeholders et fallback | Persistance navigateur vérifiée par assertion Playwright, mais le runner Windows reste bloqué au teardown |
| Backend unit | Oxlint et `npm test` réussis après les changements; 203 tests dans 53 fichiers, dont tests de validation HTTP Nest, allowlists de services et champs imbriqués | Couverture chiffrée/seuils non mesurés; tests de rôles/ressources et du cycle complet à compléter en intégration DB (BL-03) |
| Backend E2E | `npm run test:e2e`: 2 fichiers / 3 tests ignorés localement (`CI=true` requis); la CI dispose d'un PostgreSQL éphémère, applique migrations et seed avant l'exécution. `app.e2e-spec.ts` monte désormais l'application via `createApp()` et teste status + guard global | Le test de l'application composée et le test PostgreSQL concurrent doivent encore s'exécuter dans CI |
| Browser E2E | 8 scénarios actifs affichent OK, 4 ignorés par projet viewport; captures maintenant suivies | Processus reste bloqué au teardown sans résumé/code de sortie; ne pas déclarer le gate entièrement vert avant résolution |
| Accessibilité | axe couvre landing, sidebar, notifications, connexion/inscription desktop/mobile; les variantes auth affichent OK sans violation; la préférence de langue est aussi testée après rechargement | Teardown Playwright Windows reste bloqué après les assertions; formulaires métier, états d'erreur et pages principales encore à couvrir |

## Fichiers/scénarios à écrire

### Backend integration

- `footera-backend/test/auth.e2e-spec.ts`: register/login/refresh rotation/logout, expiration, mauvais origin, accès public/privé, rôles et révocation de session.
- `footera-backend/test/team-membership.e2e-spec.ts`: requête d'adhésion, approbation/refus, membre déjà lié, utilisateur non autorisé, rollback transactionnel.
- `footera-backend/test/bookings.e2e-spec.ts`: deux clients réservent même créneau simultanément; un seul réussit; annulation libère le claim.
- `footera-backend/test/uploads.e2e-spec.ts`: rôle, MIME/signature, taille et dimensions, stockage consultable après redémarrage de l'app.
- `footera-backend/test/privacy.e2e-spec.ts`: isolation des notifications, réservations, candidatures et données privées entre comptes.

### Playwright browser

- `footera-frontend/tests/browser/auth.spec.ts`: register/login/invalid credentials/session refresh/logout avec locators accessibles.
- `profile-team.spec.ts`: CV/équipe affichée, demander/rejoindre, erreurs serveur et confirmation d'approbation.
- `booking.spec.ts`: choix créneaux, total, conflit, annulation.
- `match-management.spec.ts`: création/édition, événements, start/finish, états de permissions.
- `recruitment-marketplace.spec.ts`: créer/publier annonce, candidater, retirer, filtres/favoris, upload.
- `i18n.spec.ts`: FR/EN/MG, fallback, variables interpolées, clé absente et rafraîchissement de la préférence.
- compléter snapshots desktop/mobile seulement après revue visuelle; tester les états d'erreur/chargement et axe sur dialogues/formulaires.

Utiliser `getByRole`, `getByLabel`, `getByText` et l'état accessible. Éviter de faire reposer le contrat E2E sur les classes Tailwind. Mock API pour tests UI déterministes; conserver des tests d'intégration API/DB distincts qui lancent Nest avec PostgreSQL temporaire.

## Critères de fiabilité

- CI requiert baseline existante; ne pas exécuter `--update-snapshots` automatiquement.
- Ajouter données de test stables et dates figées; aucune dépendance à prod/réseau ou aux polices externes.
- Seuils de couverture définis après mesure initiale; prioriser branches d'autorisation, transactions et erreurs plutôt qu'un pourcentage global.
- Produire traces, capture et rapport axe à l'échec; garder les tests isolés et répétables.
