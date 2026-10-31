# Audit DevOps / CI/CD

## Éléments existants

- `.github/workflows/ci.yml`: PR, push `main`/`master` et tags `v*`, manuel; permissions contents read; concurrence annulable; backend PostgreSQL 17, migrations/seed, audit npm, lint, unit + coverage + E2E + build; frontend lint/unit/Playwright/build; build conteneurs après les deux jobs.
- `.github/workflows/release.yml`: déclenché après complétion CI; publie seulement si la CI réussit sur un ref `v*`, en reconstruisant son SHA dans GHCR avec `GITHUB_TOKEN` et cache BuildKit. Le gate reste à confirmer sur un vrai run tagué.
- Backend Docker multi-stage et runtime non-root, healthcheck API; frontend Vite build puis Nginx et healthcheck.
- Compose local avec PostgreSQL healthcheck, volume nommé et port local 55432.

## Registre

| ID | Gravité | Constat | Recommandation |
|---|---|---|---|
| OPS-01 | MEDIUM / NEEDS_REVIEW | Gate ajouté : tag lance CI, puis publication sur conclusion réussie et SHA testé; chaîne non encore observée sur un vrai run GitHub | Confirmer le comportement sur tag, protéger la création des tags et publier/utiliser un digest immuable. |
| OPS-02 | MEDIUM | Actions référencées par tags de version (pas SHAs) | Épingler les actions à des SHA validés et utiliser Dependabot/Renovate pour mises à jour revues. |
| OPS-03 | MEDIUM | Images publiées sans étapes visibles de scan image, SBOM, provenance/signature ou politique de vulnérabilité | Ajouter scans et attestations, conserver le digest et bloquer selon seuils définis. |
| OPS-04 | P2 | CI exécute 3 workflows parallèles (backend/frontend/containers après build); tests visuels sans baselines propres en local | Stabiliser la suite avant de faire du résultat CI un gate; envisager cache npm/bun cohérent et artefacts de diagnostic. |
| OPS-05 | P2 | Publication conteneurs n'est pas un déploiement/rollout; aucun workflow de déploiement applicatif visible | Documenter la cible, migrations hors image runtime, rollback/health et secrets de déploiement; ne pas supposer que GHCR déploie. |
| OPS-06 | LOW | Nginx ne déclare dans le fichier consulté que proxy et fallback SPA; aucune politique de headers de sécurité explicite visible | Évaluer headers adaptés (CSP, HSTS seulement derrière TLS, frame, referrer, permissions), tests navigateur et config CDN. |

## Conteneurs et environnements

Backend: build Node 24 Alpine, génération Prisma, dépendances production séparées, exécution `node dist/main.js` comme `node`. Frontend: arguments de build `VITE_API_BASE_URL`, Nginx, `BACKEND_URL`. À tester : comportement proxy/CORS en vraie topologie, valeurs d'environnement et persistance PostgreSQL des images. Aucun Docker build n'a été lancé dans cet audit.

Pas d'indication d'un runner auto-hébergé ou d'un job privilégié dans les workflows consultés. Le pipeline ne pousse pas les images dans le job de CI (`push: false`).
