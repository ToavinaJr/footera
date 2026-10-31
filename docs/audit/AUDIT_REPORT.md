# Audit global Footera

Date : 31 octobre 2026  
Périmètre : dépôt local `footera` (frontend, backend, schéma/migrations, automatisation, conteneurs et GitHub Actions).  
Nature : revue statique et exécution des suites déjà configurées. Ce document n'est ni un pentest ni une certification de sécurité.

## Résumé exécutif

Footera est un monorepo composé d'une SPA React 19/Vite/Tailwind, d'une API REST NestJS 12, de Prisma 7/PostgreSQL et d'une automatisation GitHub Actions/Docker. Le socle comprend une authentification par jeton/cookies, des modules métier distincts, des validations spécifiques, des migrations et une CI relativement riche.

À la vérification initiale, les captures visuelles manquaient; elles sont maintenant présentes et les assertions Playwright ont toutes affiché OK (8 tests actifs, 4 ignorés car associés à l'autre viewport). Le processus Playwright reste bloqué au teardown sous Windows après le dernier scénario, sans résumé final ni code de sortie propre. Les garde-fous upload et inscription partagés utilisent le quota PostgreSQL; Oxlint et 179 tests backend dans 43 fichiers passent; le build backend passe. Les E2E backend montent désormais l'application Nest complète et couvrent l'état API et la garde globale; avec le test PostgreSQL de quota, ces tests sont ignorés localement et attendent leur exécution sur le PostgreSQL éphémère CI (`CI=true`). Aucun test n'a été lancé contre une base ou un service de production.

Les priorités ressortant des preuves sont : (1) réparer et stabiliser les références visuelles/Playwright, (2) rendre les limites d'upload distribuées et bornées, (3) remplacer les parcours E2E backend de démonstration par des scénarios HTTP métier, (4) réduire les lectures complètes et le couplage au JSON des enregistrements, (5) ajouter des contrôles de régression i18n et qualité d'accessibilité sur les parcours principaux. Aucun incident CRITICAL confirmé n'a été établi dans ce périmètre. Les audits de secrets historiques et de vulnérabilités du registre npm ne sont pas considérés comme exécutés ici.

## Cartographie

```text
Navigateur
  ├─ React/Vite SPA (footera-frontend; API client /api/v1)
  │    ├─ Vite proxy en développement
  │    └─ Nginx + proxy /api en image conteneur
  └─ API REST NestJS (footera-backend; préfixe /api/v1)
       ├─ garde JWT globale + contexte utilisateur + pagination
       ├─ services métier → RecordRepository / Prisma
       ├─ PostgreSQL (tables agrégats, payload JSON; quelques tables relationnelles auxiliaires)
       └─ images en BYTEA PostgreSQL

GitHub Actions : CI séparée frontend/backend → build des deux images → publication GHCR sur tag v*.
footera-automation : répertoire présent, aucun fichier suivi repéré dans l'inventaire.
```

Entrées principales : `footera-frontend/src/main.tsx`, `footera-frontend/src/App.tsx`, `footera-backend/src/main.ts`, `footera-backend/src/index.ts`, `footera-backend/src/app.module.ts`. Les routes backend sont réparties dans `footera-backend/src/controllers/` et `footera-backend/src/modules/`. PostgreSQL et son schéma sont définis dans `footera-backend/prisma/schema.prisma`, avec migrations versionnées.

## Dix constats prioritaires

1. **Teardown Playwright non propre dans l'environnement Windows local** : captures examinées et versionnées, 8 scénarios affichent OK/4 viewport-skips, mais la commande ne rend pas le résumé/code final (TEST-01).
2. **E2E backend insuffisant** : `test/app.e2e-spec.ts` vérifie seulement `GET /` et `Hello World!`, sans lancer l'application complète ni vérifier auth/API/DB (TEST-02).
3. **Limiteur d'upload distribué** : corrigé en code en stockant les compteurs atomiquement dans la table PostgreSQL expirante existante; tests unitaires et build passent. La vérification réelle de concurrence reste à exécuter en CI (SEC-01).
4. **Abus d'inscription (mitigation ajoutée)** : le contrôleur transmet désormais l'adresse réseau et `register()` applique un quota PostgreSQL partagé de 20 comptes par heure et par IP avec clé hachée; surveiller les faux positifs NAT et confirmer le test concurrent en CI (SEC-02).
5. **Accès aux données non paginé au niveau repository** : `list()` fait un `findMany` complet; beaucoup de services chargent plusieurs collections et filtrent/trient en mémoire (ARCH-02).
6. **Modèle de données largement en `payload Json`** : contraintes métier, index et requêtes ciblées limités pour les agrégats; concurrence, intégrité et évolution des requêtes deviennent plus coûteuses (ARCH-01).
7. **Limites de couverture produit en navigateur** : les E2E existants se concentrent sur landing/sidebar/notifications; auth, réservations, adhésion équipe, création de match, marketplace et rôle ne sont pas exercés bout-en-bout par Playwright (TEST-03).
8. **Clés i18n non sûres à l'exécution** : `t(key: string)` force un cast puis utilise la valeur française sans garde; une clé inconnue peut propager `undefined` vers `replaceAll` et faire échouer l'affichage (FE-01).
9. **Axe accessibility limité** : axe n'est exécuté que sur landing et tiroirs ciblés, pas sur les formulaires et pages métier (UX-02).
10. **Release — gate en cours** : constat initial de publication indépendante; le workflow a été changé pour attendre une CI réussie sur tag et reconstruire son SHA. Le premier run GitHub reste à confirmer; les actions sont encore référencées par tags majeurs (OPS-01/02).

## Dix risques majeurs

1. Abus d'upload si la CI ne valide pas encore l'atomicité Postgres (SEC-01, risque réduit; intégration en attente).
2. Automatisation d'inscription distribuée ou attaques par botnet peuvent contourner le quota par IP; étudier CAPTCHA adaptatif/contrôles plateforme seulement si la télémétrie le justifie (SEC-02).
3. Mauvaise interprétation d'un test visuel vert/rouge tant que les baselines ne sont ni présentes ni revues (TEST-01).
4. Régression d'autorisation ou d'intégration non repérée par l'E2E backend actuel (TEST-02/03).
5. Saturation mémoire/latence causée par chargements complets à mesure que les collections augmentent (ARCH-02).
6. Perte d'écritures concurrentes et faible intégrité référentielle sur payloads JSON (ARCH-01).
7. Risque résiduel de gate de publication non vérifié en exécution réelle; la configuration exige désormais une CI réussie sur le SHA du tag (OPS-01, NEEDS_REVIEW).
8. Dépendances transitives vulnérables non recensées par cet audit; le workflow prévoit `npm audit`, mais son résultat courant n'a pas été obtenu dans cette exécution (SEC-03).
9. Incohérences de langue ou crash dû à une clé de traduction erronée/non répertoriée (FE-01).
10. Régression d'accessibilité et responsive hors des trois surfaces testées (UX-02/TEST-03).

## Fonctionnalités à prioriser (audit de complétude)

Le dépôt implémente des parcours de compte, profils/CV sportif, clubs/équipes, matchs, tournois, terrains/réservations, recrutement, marketplace, notifications, statistiques, galeries et catalogues. Leur présence ne prouve pas leur fonctionnement complet en production. Prioriser la validation E2E des flux auth/session, demande puis acceptation d'adhésion à une équipe, création/gestion d'un match, réservation concurrente, upload par rôle, changement/révocation de mot de passe/session et gestion d'une annonce/candidature. Voir `FEATURE_MATRIX.md` et `TEST_STRATEGY.md`.

## Comptage et ordre du backlog

Backlog proposé : **15 tâches** — P0 : 0, P1 : 4, P2 : 7, P3 : 4. Les priorités sont des priorités d'ingénierie de ce plan, pas des sévérités de vulnérabilité.

1. Lot 1 (P1) : baselines Playwright maîtrisées, vrais parcours E2E métier, vérification des cas d'échec.
2. Lot 2 (P1) : limiter l'upload de façon partagée, bornée et observable; documenter/protéger l'inscription contre l'abus.
3. Lot 3 (P2) : stabiliser le contrat i18n et vérifier la complétude/interpolation des clés.
4. Lot 4 (P2) : profilage des collections/requêtes, pagination et index à partir de métriques réalistes.
5. Lot 5 (P2/P3) : accessibilité des formulaires/pages, renforcement de release, supply-chain et observabilité.

Le **premier lot prêt** est le lot de tests : les références ont été inspectées et les assertions visibles passent; reste à résoudre le teardown de Playwright et obtenir un code de sortie propre avant de le marquer DONE.

## Documents détaillés

- [Matrice fonctionnelle](./FEATURE_MATRIX.md)
- [Audit sécurité](./SECURITY_AUDIT.md)
- [Qualité du code](./CODE_QUALITY.md)
- [Revue d'architecture](./ARCHITECTURE_REVIEW.md)
- [Audit UX/UI](./UX_UI_AUDIT.md)
- [Stratégie de tests](./TEST_STRATEGY.md)
- [Audit DevOps](./DEVOPS_AUDIT.md)
- [Backlog d'implémentation](./IMPLEMENTATION_BACKLOG.md)
- [Roadmap](./IMPLEMENTATION_ROADMAP.md)

## Méthode et limites

Lecture des manifestes, configurations, controllers/services ciblés, schéma Prisma/migrations, tests et documentation existante; recherches statiques ciblées; exécution locale de lint/tests unitaires et essais E2E configurés. Les fichiers `.env` n'ont pas été lus ni leurs valeurs copiées dans ce rapport. Pas d'accès/écriture à une DB distante, pas de migration, pas de déploiement, pas de test d'intrusion, pas d'installation/scan d'historique spécialisé (Gitleaks) et pas de confirmation de CVE par registre réseau. Les fichiers de documentation préexistants dans `docs/` ont été considérés comme contexte, non comme preuve automatique de l'état courant.

Les captures actuellement suivies ont été examinées visuellement pendant la phase d'implémentation; aucun snapshot n'a été régénéré dans la seconde exécution. Le répertoire `test-results/` reste une sortie ignorée par Git.
