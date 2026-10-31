# Rapport Lot 09 — Validation stricte des mutations (tranche 1)

**Statut : NEEDS_REVIEW** · **BL-10 : inventaire et durcissement des entrées terminés**

## Changements

- Validation en allowlist des payloads de galerie (ajout, remplacement, suppression), avec champs requis et limite de longueur des URL.
- Validation des avis de terrain : note entière de 1 à 5, commentaire facultatif limité à 500 caractères.
- Validation de changement du logo d'un club et de création d'une marque dans la marketplace.
- Validation stricte des demandes d'adhésion, invitations et mises à jour (`message`, `position` si applicable), rappels d'équipe (`message`), changement du rôle actif et ajout de marque marketplace.
- Durcissement des éléments imbriqués des mises à jour de match : événements et compositions refusent maintenant les propriétés inattendues avant toute écriture.
- Les validations métier préexistantes restent dans les services, notamment l'autorisation et les URL d'images autorisées; la validation HTTP filtre aussi désormais les propriétés inconnues.
- Vérification des appels frontend existants : les clients envoient déjà les formes attendues pour adhésion, mise à jour et rappel.

## Tests et vérifications

- Matrice exhaustive des routes mutatrices et de leur stratégie de validation : `BL_10_REQUEST_MATRIX.md`.
- 15 tests unitaires/service ciblés et 9 tests HTTP Nest vérifient les propriétés inattendues, valeurs/types et l'application des pipes sur les routes modifiées.
- Suite backend complète : 203 tests dans 53 fichiers réussis.
- Oxlint et build Nest/Prisma réussis.
- Aucun changement de schéma, aucune migration et aucun accès à la base de production.

## Portée et suivi

Le balayage de tous les contrôleurs `@Body` a également vérifié les validations existantes : allowlists dans services pour match, profil, préférences et mot de passe; validation spécialisée du CV sportif, des tournois, réservations, annonces et candidatures; allowlist pour favoris; limites multipart et contrôles de type/contenu pour upload. Elles sont recensées dans la matrice afin d'éviter de dupliquer les règles métier.

BL-10 est marqué `NEEDS_REVIEW` : le contrôle des formes de requête est couvert et les contrats frontend concernés ont été vérifiés. Les parcours complets avec base (autorisations et effets métier sur plusieurs requêtes) restent suivis par BL-03; aucune base de production n'a été utilisée.
