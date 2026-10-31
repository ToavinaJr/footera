# Qualité du code

## État

- Backend TypeScript/NestJS organisé en modules; services et fonctions utilitaires disposent de tests unitaires. Oxlint et TypeScript passent dans la vérification locale.
- Frontend React sépare services API, composants, hooks/view-models et modules d'écran. `tsc --noEmit` et 11 tests unitaires passent.
- Les migrations Prisma sont versionnées et le test backend nommé E2E passe, mais sa portée est actuellement un simple endpoint de démonstration.

## Dette technique vérifiée

| ID | Constat | Preuve | Recommandation |
|---|---|---|---|
| CQ-01 | Repository générique non paginé : lecture de toutes les lignes puis mapping JSON | `footera-backend/src/database/record.repository.ts:55-60` | Mesurer volume/coût, exposer pagination ciblée par collection et convertir les hot paths en requêtes Prisma indexées. |
| CQ-02 | Modèles métier stockés majoritairement comme `payload Json` | `footera-backend/prisma/schema.prisma` | Garder JSON pour champs flexibles, mais normaliser progressivement relations/colonnes filtrées et contraintes métier à partir des chemins critiques. |
| CQ-03 | Catalogue de traductions de grande taille réparti entre `index.tsx` et `screens.ts`; clé reçue comme `string` et cast forcé | `footera-frontend/src/i18n/index.tsx:617-619` | Type dérivé des clés et fallback contrôlé avec diagnostic; ajouter test automatique parité des locales et placeholders. |
| CQ-04 | Tests navigateur concentrés sur quelques composants; références visuelles absentes au départ du run observé | `footera-frontend/tests/browser/` | Établir captures sur CI OS/browser déterministes, faire relire les images, réduire le bruit des polices/animations. |
| CQ-05 | `package.json` frontend déclare noms/scripts génériques `react-example`/`clean` avec commande Unix `rm -rf`; projet s'exécute aussi sous Windows | `footera-frontend/package.json` | Renommer proprement si compatibilité le permet et utiliser nettoyage portable ou outil de build. Pas prioritaire fonctionnellement. |
| CQ-06 | Présence de `package-lock.json` et `bun.lock` dans chaque app; choisir la source de vérité par environnement | racines frontend/backend | Documenter npm vs Bun et maintenir lockfiles cohérents; CI Docker/GHA utilise actuellement npm. |

## Recherche de code mort

Aucun fichier ou symbole n'est déclaré mort sur la seule base de recherches textuelles. `footera-automation/` ne présentait pas de fichier dans l'inventaire (`rg --files`), mais il faut confirmer s'il s'agit d'un dossier réservé plutôt que le supprimer.

## Tests locaux observés

- Backend : Oxlint réussi; 43 fichiers de tests, 178 tests réussis après les corrections du lot.
- Backend E2E : 1 test réussi, portée insuffisante pour certifier les modules.
- Frontend : TypeScript réussi; 11 tests unitaires réussis.
- Frontend Playwright : 8 scénarios actifs passent et 4 sont skip par viewport; aucune assertion en échec dans le run observé, mais le processus ne sort pas proprement sous Windows.

La couverture chiffrée (`test:cov`) n'a pas été exécutée séparément pendant cette revue; la CI la prévoit.
