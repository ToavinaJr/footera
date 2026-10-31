# Roadmap d'implémentation proposée

La progression est séquentielle entre lots lorsque le contrat ou la fiabilité dépend du précédent. BL-01, BL-02 et BL-04 ont commencé; leurs rapports de mise en œuvre consignent les vérifications et les réserves. Aucun lot n'est déclaré terminé sans gates verts.

## Lot 1 — Qualité de preuve E2E (P1)

- **Objectif :** rendre les tests actuels reproductibles et vérifier les flux réels avant les refactors.
- **Items :** BL-01, BL-02, BL-03.
- **Tâches :** valider les snapshots visuellement; fixer viewport, polices, animations et timezone; créer module e2e complet relié à PostgreSQL CI; écrire auth/équipe/réservation/upload et flux navigateur prioritaires.
- **Dépendances :** aucune hors CI PostgreSQL et Chromium déjà déclarés.
- **Complexité :** L. **Risque :** tests fragiles ou jeu de données instable.
- **Tests/acceptation :** exécutions répétées vertes, aucune baseline générée implicitement, traces en échec, isolation des comptes et données.
- **Sortie :** pipeline valide le comportement pour le code de référence.
- **État courant :** NEEDS_REVIEW — snapshots inspectés, 8 scénarios actifs OK/4 skips, mais Playwright ne termine pas proprement son processus sous Windows; BL-02 utilise désormais l'application Nest complète, à valider sous PostgreSQL CI.

## Lot 2 — Contrôle des abus d'auth et d'upload (P1/P2)

- **Objectif :** empêcher la consommation abusive des endpoints publics et uploads dans plusieurs instances.
- **Items :** BL-04, BL-05, BL-11 (scan initial).
- **Tâches :** fixer la politique; choisir stockage partagé; implémenter limites atomiques/TTL/nettoyage; traiter signup; mesurer événements sans PII; exécuter scans dependencies/secrets.
- **Dépendances :** choix infra/stockage, accès registre de paquets.
- **Complexité :** M. **Risque :** faux positifs onboarding et IP proxy mal configurée.
- **Tests/acceptation :** concurrence multi-worker, seuils réels, clients derrière proxy et alertes/éviction maîtrisées.
- **Sortie :** limites non dépendantes de l'instance et procédure de réponse documentée.
- **État courant :** BL-04 et BL-05 utilisent le compteur PostgreSQL partagé; tests unitaires/build passent, concurrence réelle et impact des IP partagées restent à surveiller en CI et après déploiement.

## Lot 3 — Contrat de traduction (P2)

- **Items :** BL-06.
- **État courant :** NEEDS_REVIEW — `t()` accepte une union de clés dérivée des traductions françaises; une clé d'équipe incorrecte a été corrigée; les clés inconnues au runtime retournent leur identifiant au lieu de provoquer une exception. TypeScript, tests unitaires et build passent. Parité exhaustive des traductions et placeholders à compléter.

## Lot 4 — Accessibilité des formulaires (P2)

- **Items :** BL-07 (première tranche).
- **État courant :** NEEDS_REVIEW — axe et assertions par rôles accessibles couvrent maintenant connexion/inscription aux deux viewports; 4 variantes affichent OK sans violation. Le processus Playwright reste bloqué au teardown Windows; reprendre le gate complet en CI et étendre la couverture aux formulaires métier.

## Lot 5 — Gate de publication (P3)

- **Items :** BL-12 (première tranche).
- **État courant :** NEEDS_REVIEW — les tags `v*` déclenchent maintenant CI; le workflow de publication attend `workflow_run` réussi et reconstruit le `head_sha` testé. À valider sur GitHub Actions; SHA pin des actions et SBOM/signature restent ouverts.

## Lot 3 — Contrats frontend et i18n (P2)

- **Objectif :** rendre les défauts de localisation visibles et sûrs.
- **Items :** BL-06, partie BL-14.
- **Tâches :** types de clés, convention d'écrans, test parité/placeholders, choix fallback dev/prod, validation des trois langues.
- **Dépendances :** décision produit sur fallback/qualité éditoriale.
- **Complexité :** M. **Risque :** régression si clés manquantes exposées.
- **Tests/acceptation :** aucune clé runtime inconnue, placeholders identiques, sélecteur persistant et chaque locale testée.

## Lot 4 — Performance et intégrité (P2)

- **Objectif :** éviter lectures complètes et sécuriser écritures critiques sur la base.
- **Items :** BL-08, BL-09, BL-10.
- **Tâches :** instrumenter hot paths; choisir filtres/pagination; migrer un agrégat à la fois; ajouter index/contraintes après profiling; couvrir requêtes de mutation.
- **Dépendances :** lot 1 pour preuve de compatibilité; mesures de données.
- **Complexité :** L. **Risque :** migration/données historiques et changements d'ordre/pagination.
- **Tests/acceptation :** migrations additives et restaurables, comparaison fonctionnelle, concurrence, bornes de queries en CI.

## Lot 5 — Accessibilité et chaîne de livraison (P2/P3)

- **Objectif :** couverture UX/a11y et intégrité des releases.
- **Items :** BL-07, BL-12, BL-13, BL-15.
- **Tâches :** axe dans formulaires, tests clavier/focus, SHA pin et gate CI, SBOM/scans/attestations, headers CSP après inventaire, logs/metrics.
- **Dépendances :** lot 1; politique de tags et capacités plateforme.
- **Complexité :** M. **Risque :** CSP bloque ressources et workflow de publication.
- **Tests/acceptation :** tests a11y ciblés verts, release prouvée par commit/digest, alertes ne divulguant pas de données sensibles.

## Ordre / parallélisation

- BL-01 et BL-02 peuvent commencer en parallèle; BL-03 attend BL-02 et fixtures stables.
- BL-04 et BL-05 sont parallélisables après choix du mécanisme de limitation.
- BL-06 peut avancer en parallèle du lot 2.
- BL-08 précède BL-09; toute migration doit être séquentielle par agrégat et précédée de backup/test restore.
- BL-12 et BL-13 peuvent se faire en parallèle mais doivent passer les mêmes validations de release.

## Gate de démarrage

Le premier lot est prêt à planifier. Avant d'accepter les snapshots produits localement pendant l'audit, les comparer aux rendus attendus et les approuver explicitement. Aucune implémentation ni migration ne fait partie du présent audit.
