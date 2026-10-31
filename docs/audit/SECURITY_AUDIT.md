# Audit sécurité

## Registre des constats

| ID | Gravité | Preuve / emplacement | Risque et correction recommandée |
|---|---|---|---|
| SEC-01 | MEDIUM | `footera-backend/src/modules/uploads/uploads.service.ts:107`, `:153-159` | Le rate limiter est un `Map` local par instance et conserve les clés jusqu'à une nouvelle requête de cette IP. En déploiement multi-instance/serverless, la limite se contourne en changeant d'instance; des IPs arbitraires peuvent faire croître la map. Remplacer par limiteur PostgreSQL/Redis atomique avec TTL/nettoyage, règles par compte et IP; test multi-instance/concurrence. |
| SEC-02 | MEDIUM (à confirmer) | `footera-backend/src/controllers/auth.controller.ts:14-21`, `footera-backend/src/modules/auth/auth.service.ts:45-77` | Route d'inscription publique; le code observé applique la limitation d'échecs au login, mais pas de limite de création persistante visible sur register. Confirmer une protection de plateforme avant de conclure à l'exposition; ajouter quota/rate-limit, détection d'abus et test de rafale. |
| SEC-03 | UNKNOWN / vérification requise | `.github/workflows/ci.yml:50,82`; `package-lock.json` frontend/backend | CI exécute `npm audit --audit-level=high`, mais aucun résultat de registre/CVE n'a été obtenu pendant cette revue. Exécuter l'audit sur les lockfiles dans CI et traiter les vulnérabilités confirmées; ne pas déclarer de CVE sans résultat daté. |
| SEC-04 | LOW (processus) | workflows CI/release; historique git non scanné | Aucun scan Gitleaks/équivalent de l'historique n'a été effectué. Les valeurs de secrets des `.env` n'ont pas été inspectées ou publiées. Lancer un secret scan dans l'environnement approprié et faire tourner toute clé détectée. |
| SEC-05 | MEDIUM (supply-chain) | `.github/workflows/ci.yml:43,75,112`; `.github/workflows/release.yml:25,27,29,40` | Actions GitHub référencées par tags (`@v4`, `@v6`), pas par SHA commit immuable; un tag amont compromis/mutable pourrait modifier l'action. Épingler à SHA vérifié et automatiser les mises à jour. |

Aucun CRITICAL/HIGH exploitable n'a été confirmé par les vérifications effectuées. « Aucun constat confirmé » ne signifie pas « absence de vulnérabilité ».

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
