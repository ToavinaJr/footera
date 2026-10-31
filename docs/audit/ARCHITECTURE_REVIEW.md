# Revue d'architecture

## Architecture actuelle

Monorepo avec applications autonomes : `footera-frontend` (React/Vite, Tailwind CSS v4), `footera-backend` (NestJS REST, Prisma, PostgreSQL), `footera-automation` (aucun fichier suivi/repéré), documentation et pipelines GitHub Actions. Le backend utilise des contrôleurs → services métier → `RecordRepository`/`PrismaService`; un garde et des interceptors sont enregistrés globalement. Les tables PostgreSQL contiennent souvent `id` + `payload Json`, avec des tables relationnelles auxiliaires pour réservations, demandes/claims et autres mécanismes ciblés.

## Constats

| ID | Impact | Preuve | Direction recommandée |
|---|---|---|---|
| ARCH-01 | Intégrité, concurrence, capacité de requête | `prisma/schema.prisma`; tables `*Record` contenant `payload Json` | Strangler migration : convertir d'abord les agrégats à mutations concurrentes/filtrage important; préserver le contrat API; contraintes/index et migration testée. Éviter une réécriture big-bang. |
| ARCH-02 | Latence/mémoire à croissance des collections | `RecordRepository.list()` fait `findMany` complet; services chargent plusieurs listes en parallèle | Tracer taille, temps et nombre d'octets; ajouter pagination et filtres DB dans les hot paths, bornes systématiques et index justifiés. |
| ARCH-03 | Contrat i18n difficile à sécuriser | `t(key: string)` et cast en `MessageKey` dans `i18n/index.tsx` | Type partagé de clés, fallback observable et test de complétude de chaque locale. |
| ARCH-04 | Couplage déploiement frontend/backend configurable par proxy | Vite, Nginx et rewrite Vercel différents | Documenter les valeurs d'API par env et ajouter health/smoke tests de chaque cible avant release; garder une seule stratégie d'origine par environnement. |

## Éléments satisfaisants

- Modules métier NestJS distincts et services injectés; peu d'indication de dépendance circulaire dans les graphes examinés.
- `RecordRepository` isole l'accès aux collections et certaines opérations transactionnelles/atomiques sont dédiées.
- Les DTO/validateurs spécialisés existent pour plusieurs mutations, les tests unitaires en vérifient des règles.
- Les agrégats peuvent rester isolés; la recommandation n'est pas une architecture distribuée ni l'introduction d'un ORM/repository supplémentaire.

## Architecture cible pragmatique

Conserver le monolithe modulaire et l'API existante. Pour les parcours les plus sollicités, déplacer filtres/tri/pagination en PostgreSQL, normaliser uniquement les relations et colonnes ayant contraintes de cohérence, et garder JSON pour les champs souples. Ajouter un test d'intégration par transaction critique et mesurer avant/après. Le contrat API demeure indépendant des détails Prisma.
