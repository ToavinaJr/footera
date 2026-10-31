# Rapport Lot 02 — Limitation d'upload distribuée

**Statut final : NEEDS_REVIEW** · **Tâches traitées : 0 DONE, 1 NEEDS_REVIEW (BL-04)** · **Bloquées : 0**

## Objectif

Retirer le compteur d'upload en mémoire locale à l'instance, préserver le quota de 20 images par adresse réseau sur une fenêtre d'une heure, et éviter une migration si le schéma actuel le permet.

## Modifications réalisées

- `UploadsService` utilise maintenant `RecordRepository` pour consommer le quota avant validation/enregistrement du fichier.
- Nouvelle méthode `consumeRateLimit` utilise un UPSERT PostgreSQL atomique sur la table `auth_login_attempts` déjà existante; les lignes expirées sont nettoyées, et les clés persistées sont des empreintes SHA-256 d'IP plutôt que les IPs brutes.
- Le contrôleur de test fournit le dépôt; les tests service/repository couvrent le quota, les paramètres temporels et le refus après dépassement.
- Un test E2E PostgreSQL couvre les appels concurrents et la réinitialisation après expiration. Il est activé uniquement sous `CI=true`, lorsque `DATABASE_URL` correspond à la base éphémère CI.
- Migration, fichiers supprimés : aucun.

## Fichiers impactés

- Modifiés : `footera-backend/src/database/record.repository.ts`, `record.repository.spec.ts`, `footera-backend/src/modules/uploads/uploads.service.ts`, `uploads.service.spec.ts`, `footera-backend/src/controllers/uploads.controller.spec.ts`.
- Créé : `footera-backend/test/rate-limit.e2e-spec.ts`.
- Documentation : backlog, stratégie de tests, audit sécurité et roadmap mis à jour.

## Tests / non-régression

- `npm test` : **43 fichiers, 178 tests passés**.
- `npm run lint` : réussi.
- `npm run build` : réussi.
- `npm run test:e2e` : 1 réussi, 1 ignoré localement. Le test DB est ignoré hors `CI=true`; l'atomicité n'a pas été vérifiée contre PostgreSQL dans cet environnement afin de ne pas toucher à la base de développement.
- Tests ciblés : services upload + repository, 13 tests passés.
- Régressions introduites : une première exécution complète a échoué car le module de test du contrôleur n'injectait pas `RecordRepository`; provider ajouté, puis suite complète verte.
- Compatibilité API/DB : contrat HTTP inchangé; schéma inchangé; réutilisation de la table existante.

## Critères, risques résiduels et statut

Code, lint, build et tests unitaires satisfont leurs critères. **NEEDS_REVIEW** jusqu'au passage du scénario PostgreSQL concurrent en CI (test de base isolée), et revue que `TRUST_PROXY_HOPS`/proxy fournissent l'adresse IP client attendue. Aucun déploiement ni migration n'a été effectué.

Prochaine action : traiter BL-05 uniquement après confirmation de la politique produit de limitation d'inscription; continuer les tâches de test BL-02/BL-03.
