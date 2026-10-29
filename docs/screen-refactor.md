# Refactorisation des écrans

Objectif : Home personnalisée, Matchs, Équipes, Tournois, Joueurs, Marketplace,
Terrains, Mercato et Paramètres, sans retrait des fonctionnalités existantes.

## Lots

- [ ] 1. Navigation compatible et outils communs de liste (URL, erreurs, pagination).
- [ ] 2. Favoris persistants, dashboard privé et activité réelle.
- [ ] 3. Home et Matchs ; liens directs indépendants des filtres.
- [ ] 4. Joueurs, Équipes, Tournois, Marketplace, Terrains et Mercato.
- [ ] 5. Paramètres : profil/CV, équipe, rôles, réservations, candidatures,
  préférences et sécurité.
- [ ] 6. Régression, builds et CI.

## Invariants de compatibilité

- Les routes historiques `/profile`, `/profile/edit-cv`, `/profile/bookings/:id`,
  `/profile/applications` et `/recruitment/:id` restent accessibles.
- Les profils publics, statistiques, galeries, logos et notifications restent disponibles.
- Les actions de gestion de match, inscription à un tournoi, réservation/annulation,
  candidature/retrait, invitation, demande d'adhésion/traitement/départ et demande
  de rôle/annulation conservent leurs contrôles serveur.
- Les anciens clients API qui attendent des tableaux restent compatibles.
- La Home ne mélange pas les données privées de plusieurs utilisateurs.
- Une liste filtrée ne doit pas empêcher l'ouverture d'un détail par URL.

## Validation

Chaque lot comporte des vérifications ciblées. La validation finale comprend les
tests frontend, le typage, les tests backend, le lint, les builds et, lorsqu'une
base de test isolée est disponible, les tests HTTP e2e. Les résultats et limites
effectivement observés seront consignés ici.
