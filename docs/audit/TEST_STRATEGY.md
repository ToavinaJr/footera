# Stratégie de tests

## État vérifié

| Couche | État/résultat de l'audit | Limite |
|---|---|---|
| Frontend unit | `npm run lint` et `npm run test:unit` réussis; 11 assertions réparties sur API response, upload, dates, routes | Peu de logique view-model/domain testée directement |
| Backend unit | Oxlint et `npm test` réussis; 177 tests dans 43 fichiers | Couverture annoncée par commande CI, mais seuils/couverture non mesurés pendant cet audit |
| Backend E2E | `npm run test:e2e` réussi (1) | Teste seulement `GET /`/Hello World, pas la composition réelle de l'application |
| Browser E2E | Playwright lancé; smoke desktop/mobile visibles réussis; tests screenshots échouent faute de snapshot de référence; run interrompu sans résumé final | Pas de verdict complet sur tests restants; aucune baseline n'est approuvée |
| Accessibilité | axe sur quelques écrans seulement | Les parcours formulaire et état dynamique ne sont pas couverts |

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
