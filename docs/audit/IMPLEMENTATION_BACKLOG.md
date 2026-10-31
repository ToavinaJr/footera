# Backlog d'implémentation

Estimation relative : XS (<1 jour), S (1–2), M (3–5), L (>5). Les estimations devront être ajustées par l'équipe. Tout item reste **TODO** jusqu'à validation explicite et planification.

| ID | Priorité / statut | Objectif et tâches | Modules/fichiers | Dépendances | Complexité / régression | Tests / critères d'acceptation |
|---|---|---|---|---|---|---|
| BL-01 | P1 TODO | Établir/revoir snapshots actuels, stabiliser browser specs | frontend `tests/browser`, `playwright.config.ts` | Environnement Chromium homogène | S; risque de bénir une régression visuelle | Baselines revues et tests répétés verts sur CI desktop/mobile |
| BL-02 | P1 TODO | Remplacer l'E2E racine par test d'application Nest réellement composés | backend `test/`, `app.factory.ts` | PostgreSQL CI | M; setup/config DB | Auth/session, API et DB testées sans dépendre de prod |
| BL-03 | P1 TODO | Ajouter scénarios E2E prioritaires comptes/équipe/match/réservation | frontend `tests/browser`, backend `test/` | BL-02, fixtures stables | L; séquences asynchrones | Parcours critiques reproductibles avec assertions d'autorisation et erreurs |
| BL-04 | P1 TODO | Rate limit upload distribué avec TTL et clé maîtrisée | `uploads.service.ts`, repository/schema | Choix Redis ou PostgreSQL; métrique de volume | M; concurrence/limites | Limite stable entre instances, cardinalité bornée, tests parallèles |
| BL-05 | P2 TODO | Évaluer et ajouter contrôle anti-abus inscription | auth controller/service + infra | Politique de signup et limites par IP/email | S/M; impact onboarding | Rafales contrôlées, pas de faux blocage nominal, métriques sans données sensibles |
| BL-06 | P2 TODO | Typer keys i18n, fallback runtime et contrôle de parité | `i18n/index.tsx`, `screens.ts`, types | Décision sur clé inconnue (dev throw/prod fallback) | M; chaînes d'écrans | test toutes les clés/langues/placeholders et préférence persistée |
| BL-07 | P2 TODO | Ajouter axe/form tests sur formulaires et pages | Playwright browser | BL-01 | M; corrections UX possibles | Aucune violation WCAG axe non justifiée sur parcours prioritaires |
| BL-08 | P2 TODO | Paginer et filtrer DB collections les plus coûteuses | `RecordRepository`, services métier | Profiling/volumes réalistes | L; tri/compat API | bornes queries, réponse API stable, tests perf baselines |
| BL-09 | P2 TODO | Normaliser les agrégats critiques et contraintes choisies | Prisma schema/migrations, repository/services | BL-08, plan de migration et backup | L; risque migration élevé | migrations additive, intégrité et concurrence testées sur copie de test |
| BL-10 | P2 TODO | Étendre validation stricte à toutes mutations | controllers/services validators | Matrice endpoints | M/L; compat clients | tests allowlist/tailles/types/erreurs sur tous POST/PUT/PATCH |
| BL-11 | P2 TODO | Scanner dépendances et secrets de manière reproductible | workflows, lockfiles, secret scan | accès réseau/outils, règles de rétention | S; faux positifs | rapport daté en CI, zéro secret réel, politique de remédiation |
| BL-12 | P3 TODO | Renforcer release : CI gate, SHA pin, SBOM/scan/signature | `.github/workflows/release.yml` | droits GHCR/branch/tag | M; publication | release refusée sans CI; image attestée par digest |
| BL-13 | P3 TODO | Revoir headers Nginx/CSP avec app réelle | `nginx.conf`, tests browser | inventaire scripts/images/connect-src | S/M; compatibilité assets | headers validés sur SPA et API sans casser ressources |
| BL-14 | P3 TODO | Clarifier gestion npm/Bun et nom/scripts frontend | manifests, README, Docker/CI | décision outil officiel | XS/S | lockfile et CI alignés sur une procédure reproductible |
| BL-15 | P3 TODO | Ajouter observabilité des parcours/DB sans données secrètes | Nest logger, health/metrics, docs ops | plateforme d'hébergement | M | correlation IDs, latence/erreurs exploitables, pas de tokens/PII dans logs |

Totaux : **15 tâches — P0 0, P1 4, P2 7, P3 4**. Aucun changement n'est effectué par ce backlog.
