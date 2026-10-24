# Plan d’audit et refactorisation progressive

Les lots sont ordonnés selon l’exposition et l’impact. Le statut `En cours` signifie que les tests unitaires existent mais que la fonctionnalité complète (par exemple interface opérateur) peut encore manquer.

| ID | Sujet | Priorité | Statut |
|---|---|---:|---|
| FT-001 | Demandes d’adhésion : persistance, accès staff et transitions de statut | P0 | API et migration faites ; interface de traitement à compléter |
| FT-002 | Empêcher le seed et la réinitialisation des données de démo en production | P0 | Corrigé et testé |
| FT-003 | Autoriser l’inscription à un tournoi uniquement au propriétaire/responsable d’équipe | P0 | Corrigé et testé |
| FT-004 | Réservation atomique des créneaux avec contrainte DB/idempotence | P0 | À faire ; risque de concurrence confirmé |
| FT-005 | Validation de toutes les entrées HTTP par DTO/ValidationPipe global | P1 | À faire ; inventaire des entrées requis |
| FT-006 | Limitation des tentatives login/inscription et stratégie distribuée pour les uploads | P1 | À faire |
| FT-007 | Revue d’autorisations des mutations (tournois, effectifs, scores et catalogue) | P1 | À faire ; la création de tournoi mérite notamment un contrôle de rôle |
| FT-008 | Remplacer valeurs marketplace simulées par données persistées/calculées | P1 | À faire |
| FT-009 | Migration progressive des payloads JSON vers schéma relationnel et contraintes | P1 | À planifier par agrégat, avec migrations rétrocompatibles |
| FT-010 | Couverture de tests d’intégration des permissions et courses de concurrence | P1 | Tests unitaires de régression partiels ; intégration à faire |
| FT-011 | Compléter l’internationalisation frontend et éliminer les textes UI codés | P2 | À faire |
| FT-012 | Scan de dépendances reproductible dans CI et lockfiles cohérents | P1 | Partiel ; audits npm bloqués localement et lock npm frontend inexploitable |
| FT-013 | Scan Gitleaks de tout l’historique et rotation si un secret est découvert | P0 | À faire ; Gitleaks absent lors de l’audit |
| FT-014 | Observabilité, alertes, sauvegardes et exercices de restauration PostgreSQL | P1 | À documenter/configurer selon l’hébergeur |

## Découpage proposé

1. **Lot sécurité immédiate (réalisé en partie)** : empêcher la pollution de production par le seed, vérifier les permissions d’inscription, persister les demandes d’adhésion et tester les refus.
2. **Lot intégrité métier** : réservation transactionnelle/idempotente, verrouillage de disponibilité et tests concurrents ; définir également les invariants d’effectif et de classement.
3. **Lot sécurité API** : DTOs stricts, ValidationPipe, limitation de débit partagée, revue des permissions par rôle et erreurs sans fuite d’information.
4. **Lot données et architecture** : normaliser les agrégats prioritaires, garder les migrations additives et ajouter des contraintes/index après backfill vérifié.
5. **Lot qualité produit** : internationalisation complète, retrait des données de démonstration hors seed et observabilité/restauration.

Chaque lot doit ajouter des tests avant de modifier le comportement, inclure une migration réversible ou additive si la structure change, exécuter lint/tests/build et mettre à jour ce tableau et `technical-audit.md`.
