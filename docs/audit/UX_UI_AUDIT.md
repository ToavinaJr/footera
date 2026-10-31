# Audit UX/UI et frontend

## Points solides observés

- Interface découpée en écrans et view-models par domaine, composants communs pour listes, formulaires, modales, états vides et squelette.
- CSS contient des règles globales `:focus-visible` et de réduction de mouvement dans `footera-frontend/src/index.css`.
- Playwright sépare projets desktop et mobile; axe est déjà utilisé sur landing et deux tiroirs.
- Le provider choisit FR/EN/MG et persiste la préférence localement.

## Dette et améliorations

| ID | Priorité | Observation et zones | Travail recommandé |
|---|---|---|---|
| UX-01 | P1 | Utilitaire i18n dans `src/i18n/index.tsx`; clé arbitraire et fallback FR masquant l'absence de traduction | Typage exhaustif des clés, comportement contrôlé pour clé absente, tests de fallback, placeholders et changement de langue. |
| UX-02 | P1 | Axe limité à `landing.spec.ts`, `sidebar.spec.ts`, `notifications.spec.ts` | Étendre l'analyse aux formulaires auth/profil, modal de réservation/adhésion, pages liste/detail, erreurs et états vides. Corriger les violations vérifiées une par une. |
| UX-03 | P2 | Baselines screenshot absentes lors du run local | Ajouter baseline approuvée par écran et par viewport; désactiver animations/attendre polices; éviter l'acceptation automatique du résultat généré. |
| UX-04 | P2 | Beaucoup d'écrans métier mais peu de scénarios responsive cross-page | Tests largeur 320/390/768/1024/1440, zoom/clavier, débordement horizontal, modales et tables. |
| UX-05 | P2 | Erreurs/loading/empty states implémentés en composants communs mais pas uniformément vérifiés en interaction | Définir states load/success/empty/error/retry et vérifier annonces live, focus de modale, conservation du focus à fermeture. |
| UX-06 | P3 | Documentation des traductions est séparée des écrans/modules | Ajouter contrôle CI de parité des locales et extraction de chaînes pour limiter les divergences. |

Cette revue de code ne prétend pas avoir validé optiquement chaque écran; l'inspection visuelle automatisée est actuellement bloquée par l'absence de références versionnées.
