# Matrice fonctionnelle

Statuts : **Présent** = code de parcours identifiable; **À valider E2E** = tests métier réels insuffisants; **Partiel/inconnu** = présence de composants/services sans validation opérationnelle complète. L'audit ne certifie aucun flux de production.

| Domaine | Capacités identifiées dans le code | Statut/écart principal | Surfaces |
|---|---|---|---|
| Authentification/compte | inscription, connexion, session refresh/logout, profil, rôles, changement mot de passe, sessions | Présent; E2E navigateur et intégration DB complète manquants | `footera-backend/src/controllers/auth.controller.ts`, `footera-backend/src/modules/auth/`; `footera-frontend/src/components/modules/Auth/`, `Settings/` |
| Profil et CV sportif | données personnelles, préférences, CV, recherche équipe/demande d'adhésion | Présent; cohérence des relations et droits à parcourir en E2E | `footera-backend/src/modules/accounts/`; `footera-frontend/src/components/modules/Profile/` |
| Joueurs | listing/filtre, profils, stats, invitations/favoris | Présent; confidentialité des contacts doit rester couverte par tests dédiés | `footera-backend/src/modules/players/`; `footera-frontend/src/components/modules/Players/` |
| Équipes/clubs | équipes, effectif, demandes d'adhésion/invitations, gestion et clubs | Présent; scénarios acceptation/refus, propriétaires/manager à couvrir par navigateur | `footera-backend/src/modules/teams/`, `clubs/`; frontend `Teams/` |
| Matchs/tournois | listing, événements, gestion de match, classement, inscription tournoi | Présent; assertions intégrées DB/permissions et parcours complet à renforcer | `matches/`, `tournaments/`; frontend `Matches/`, `Tournaments/` |
| Terrains/réservations | catalogues terrain, créneaux, réservation batch, annulation | Présent; concurrence a des tests backend spécialisés, parcours multi-utilisateur E2E absent | `bookings/`, `pitches/`; frontend `Pitches/` |
| Recrutement | annonces, candidatures, suivi/annulation et notifications | Présent; test E2E du parcours candidat/staff manquant | `recruitment/`; frontend `Recruitment/` |
| Marketplace | annonces, recherche, favoris/contact, upload | Présent; paiement/transaction commerciale non constatés dans les routes inspectées, ne pas considérer comme e-commerce complet | `marketplace/`; frontend `Marketplace/` |
| Uploads/galeries | upload d'images validées, galerie attachée à entités | Présent; limite de débit process-local et stockage DB à surveiller | `uploads/`, `galleries/`; composants communs frontend |
| Notifications/activité | notifications privées, feed d'activité publique, tiroir | Présent; tests E2E ciblent surtout tiroir et états visuels | `notifications/`, `activity-feed.controller.ts`; `NotificationsDrawer.tsx` |
| Statistiques/catalogues | stats, classements, options partagées | Présent; fraîcheur et exactitude des données en intégration sont à garantir | `stats/`, `catalogs/`; frontend `Stats/` |
| Automatisation | CI, build images, release GHCR; dossier automation sans source repéré | CI/release présentes; déploiement applicatif/rollout non identifié | `.github/workflows/`, Dockerfiles |
| Internationalisation | français, anglais, malgache; provider et fallback français | Présent; clés runtime non typées; pas de test de parité/fallback explicite | `footera-frontend/src/i18n/index.tsx`, `screens.ts`, `types.ts` |

## Parcours de production à prouver

1. Inscription → cookie/session → profil courant → expiration/refresh → logout/révocation.
2. CV avec équipe courante → demande d'adhésion → approbation/refus par staff → dashboard prochain match.
3. Création d'équipe/match → composition/événements → mise à jour du classement et statistiques.
4. Réservation de créneaux simultanée → un seul succès → annulation/libération → nouvelle réservation.
5. Upload authentifié, restrictions de rôle, limites de taille/type, persistance après redémarrage et accès image.
6. Publication offre → candidature → réponse staff → notification → retrait.

Cette matrice est une cartographie du code et des tests consultés, pas une garantie que les intégrations externes ou le déploiement sont actifs.
