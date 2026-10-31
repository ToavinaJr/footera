# Rapport Lot 09 — Validation stricte des mutations (tranche 1)

**Statut : IN_PROGRESS** · **BL-10 : première tranche implémentée, inventaire exhaustif restant**

## Changements

- Validation en allowlist des payloads de galerie (ajout, remplacement, suppression), avec champs requis et limite de longueur des URL.
- Validation des avis de terrain : note entière de 1 à 5, commentaire facultatif limité à 500 caractères.
- Validation de changement du logo d'un club et de création d'une marque dans la marketplace.
- Validation stricte des demandes d'adhésion, invitations et mises à jour (`message`, `position` si applicable), rappels d'équipe (`message`), changement du rôle actif et ajout de marque marketplace.
- Les validations métier préexistantes restent dans les services, notamment l'autorisation et les URL d'images autorisées; la validation HTTP filtre aussi désormais les propriétés inconnues.
- Vérification des appels frontend existants : les clients envoient déjà les formes attendues pour adhésion, mise à jour et rappel.

## Tests et vérifications

- 14 tests ciblés de validateurs, plus 9 tests HTTP Nest vérifiant l'application des pipes sur les routes de galerie, adhésion, avis terrain, logo, invitation, marque et rôle actif.
- Suite backend complète : 202 tests dans 53 fichiers réussis.
- Oxlint et build Nest/Prisma réussis.
- Aucun changement de schéma, aucune migration et aucun accès à la base de production.

## Suite de BL-10

Le balayage de tous les contrôleurs `@Body` a également vérifié les validations déjà en place : allowlists dans services pour match, profil, préférences et mot de passe; validation spécialisée du CV sportif et des tournois, réservations, annonces et candidatures; allowlist en ligne pour favoris; limite de champs multipart et allowlist de type pour upload. Ces validations existantes évitent une duplication au contrôleur.

BL-10 reste `IN_PROGRESS` : tous les pipes ajoutés dans cette tranche sont exercés par des tests HTTP Nest, mais il manque une matrice persistée handler-par-handler et la couverture d'intégration DB des autorisations et effets métier. La suite actuelle prouve le filtrage des payloads HTTP, pas la couverture E2E de chaque mutation.
