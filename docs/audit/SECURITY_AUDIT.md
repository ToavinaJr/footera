# Audit sécurité

## Registre des constats

| ID | Gravité | Preuve / emplacement | Risque et correction recommandée |
|---|---|---|---|
| SEC-01 | MEDIUM — CORRIGÉ, intégration à valider | Ancienne preuve : `uploads.service.ts` utilisait une `Map` par instance. Correction : `UploadsService` appelle `RecordRepository.consumeRateLimit`; la méthode fait un UPSERT atomique sur `auth_login_attempts`, stocke une empreinte SHA-256 de l'adresse IP et supprime les lignes expirées. | Le quota ne dépend plus de la mémoire d'une instance et n'ajoute pas de migration. Tests unitaires ciblés et build passent. Un test de concurrence PostgreSQL est ajouté sous `footera-backend/test/rate-limit.e2e-spec.ts`, mais n'a pas été exécuté localement car la suite CI seule est autorisée à utiliser son DB éphémère; confirmer en CI. |
| SEC-02 | MEDIUM / NEEDS_REVIEW | `footera-backend/src/controllers/auth.controller.ts`, `footera-backend/src/modules/auth/auth.service.ts` | Limite persistante ajoutée : 20 inscriptions valides par IP et fenêtre d'une heure via la table PostgreSQL partagée; identifiant de client haché. À confirmer par test concurrent CI et mesure des faux positifs en contexte NAT/proxy. Ce quota est une défense de base, pas une protection anti-bot complète. |
| SEC-03 | UNKNOWN / vérification requise | `.github/workflows/ci.yml:50,82`; `package-lock.json` frontend/backend | CI exécute `npm audit --audit-level=high`, mais aucun résultat de registre/CVE n'a été obtenu pendant cette revue. Exécuter l'audit sur les lockfiles dans CI et traiter les vulnérabilités confirmées; ne pas déclarer de CVE sans résultat daté. |
| SEC-04 | LOW (processus) | workflows CI/release; historique git non scanné | Aucun scan Gitleaks/équivalent de l'historique n'a été effectué. Les valeurs de secrets des `.env` n'ont pas été inspectées ou publiées. Lancer un secret scan dans l'environnement approprié et faire tourner toute clé détectée. |
| SEC-05 | MEDIUM (supply-chain) | `.github/workflows/ci.yml:43,75,112`; `.github/workflows/release.yml:25,27,29,40` | Actions GitHub référencées par tags (`@v4`, `@v6`), pas par SHA commit immuable; un tag amont compromis/mutable pourrait modifier l'action. Épingler à SHA vérifié et automatiser les mises à jour. |

Aucun CRITICAL/HIGH exploitable n'a été confirmé par les vérifications effectuées. « Aucun constat confirmé » ne signifie pas « absence de vulnérabilité ». SEC-01 reste NEEDS_REVIEW jusqu'au passage du test d'intégration PostgreSQL en CI.

## Contrôles observés (points positifs)

- Garde JWT globale et vérification de session persistée; cookies `HttpOnly`, `SameSite=Lax`, `Secure` en production dans `auth.controller.ts`.
- Origine vérifiée pour les requêtes mutantes par `JwtAuthGuard`; CORS configuré à partir de `FRONTEND_URL` dans `app.factory.ts`.
- Vérification de signatures/dimensions et limite de taille d'images dans `uploads.service.ts`; limites multipart dans `uploads.controller.ts`.
- Mot de passe hashé via scrypt, comparaison temporellement sûre et refresh token hashé; voir `auth.service.ts`.
- Image backend en utilisateur non-root (`USER node`); workflow CI permission `contents: read`, publication permission `packages: write`.
- Validation stricte existe pour plusieurs formulaires/routes; néanmoins, l'examen exhaustif des limites de tous les handlers d'écriture est un travail distinct.

## Tests de sécurité à ajouter

- Taux d'inscription et d'upload résistant à plusieurs processus et aux clés à haute cardinalité.
- Cookies/CORS/origin: absence, origine étrangère, sous-domaines et proxy déployé; rotation/rejeu de refresh token.
- Vérifier chaque rôle sur actions de mutation et ressources IDOR (équipes, clubs, annonces, réservations, galeries).
- Test de validation de contenu multipart, taille, dimensions, MIME falsifié et format polyglotte.
- Scan de lockfiles et historique des secrets; rapport CI conservé comme artefact.

Périmètre : lecture statique et tests existants. Pas de pentest, fuzzing, audit de dépendances réseau, scan d'historique Git ni audit de configuration des comptes d'hébergement.
