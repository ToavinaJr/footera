# BL-10 — Matrice des mutations et validation des entrées

**Périmètre vérifié :** routes de mutation backend (`POST`, `PUT`, `PATCH`, `DELETE`) et leurs corps de requête; vérification des contrôleurs, validateurs/services et appels frontend repérés.

| Routes de mutation | Contrat de validation | Preuve automatisée |
|---|---|---|
| `POST /auth/register`, `/auth/login`; `PUT /auth/profile` | Pipes stricts (champs autorisés, types, formats et limites) | `auth-request.validation.spec.ts`, `auth.service.spec.ts` |
| `PUT /auth/preferences`, `/auth/password`, `/auth/sports-cv` | Allowlist/type/domain validation dans `AccountsService`, `AuthService` et `validateSportsCvPayload` | `accounts.service.spec.ts`, `sports-cv.validation.spec.ts`; `auth.service.spec.ts` rejette les propriétés additionnelles de changement de mot de passe avant lookup |
| `POST /auth/role` | Pipe strict de rôle + autorisation du rôle détenu vérifiée dans le service | `active-role-request.validation.spec.ts`, `mutation-request-contracts.controller.spec.ts`, `accounts.service.spec.ts` |
| `POST /galleries/:entity/:id`, `PUT ...`, `DELETE ...` | Pipe strict par opération; URLs encore vérifiées par le service; entité allowlistée | `gallery-request.validation.spec.ts`, `galleries.controller.spec.ts` (HTTP) |
| `PATCH /clubs/:id/logo` | Pipe strict de champ et longueur; URL autorisée et rôle/ownership vérifiés par le service | `club-logo-request.validation.spec.ts`, contrat HTTP dans `mutation-request-contracts.controller.spec.ts`, `clubs.service.spec.ts` |
| `POST /marketplace/brands`, `/marketplace` | Pipe strict de marque; pipe strict de création d'annonce avec URL/image, tailles et types | `marketplace-brand-request.validation.spec.ts`, contrat HTTP; `marketplace-request.validation.spec.ts` |
| `POST /pitches/:id/reviews`, `/pitches` | Pipe strict note/commentaire; pipe strict de création du terrain | `pitch-review-request.validation.spec.ts`, contrat HTTP; `pitch-request.validation.spec.ts` |
| `POST /players/:id/invite`; `/teams/:id/join`; `PATCH /teams/my-join-requests/:requestId`; `POST /teams/:id/reminders` | Pipes stricts avec message/poste bornés; catalogue de postes et droits vérifiés dans les services | `player-invitation-request.validation.spec.ts`, `team-mutation-request.validation.spec.ts`, contrats HTTP dans `mutation-request-contracts.controller.spec.ts` et `teams.controller.spec.ts`; `teams.service.spec.ts` |
| `PUT /matches/:id` | Allowlist de champs au service; événements et compositions rejettent maintenant les propriétés imbriquées inconnues; références de joueurs/équipes validées | `matches.service.spec.ts` couvre champs invalides, champs imbriqués additionnels, références et mise à jour valide |
| `POST /bookings/quote`, `/bookings/batch`, `/bookings` | Pipes stricts; les sélections imbriquées autorisent exactement `date` et `time`; bornes de lot | `booking-request.validation.spec.ts`, `bookings.service.spec.ts` |
| `POST /recruitment/ads/:id/apply` | Pipe strict, téléphone et message bornés | `recruitment-request.validation.spec.ts` |
| `POST /role-requests` | Pipe dédié, rôle en enum allowlist, justification bornée; service applique les droits | `role-request.validation.spec.ts`, `role-requests.service.spec.ts` |
| `POST /tournaments`, `/tournaments/:id/register` | Pipes stricts, champs requis, enum/limites et dates; champs inconnus refusés | `tournament-request.validation.spec.ts`, `tournaments.service.spec.ts` |
| `PUT /favorites/:entity/:id` | Validation inline exacte (`favorite` booléen uniquement), entité allowlistée, propriétaire authentifié et règles métier | `favorites.controller.spec.ts` couvre type, entité, propriété additionnelle, cible et match terminé |
| `POST /uploads/images` | Multer borne nombre de parties/champs/fichiers et taille; type, signature, purpose et rôle autorisé côté service | `uploads.controller.spec.ts`, `uploads.service.spec.ts` |
| `POST /notifications/:id/read`, `/notifications/read-all`; actions de match/équipe/tournoi/réservation sans `@Body`; suppressions/annulations | Aucun corps métier consommé; les mutations s'appuient sur l'identité, les paramètres de route et les autorisations du service | Tests des services métier correspondants; pas de schéma de body à maintenir |

## Compatibilité et décision

- Les parcours frontend existants d'adhésion, de mise à jour de demande, de rappel et d'invitation envoient les formes compatibles avec les nouveaux validateurs.
- Les propriétés dérivées (ex. `player`, `assist`) envoyées par l'API dans les événements de match ne font pas partie du contrat d'écriture; le formulaire frontend construit déjà une charge utile dédiée qui ne les renvoie pas.
- Les règles métier existantes restent dans les services; les pipes contrôlent le contrat HTTP sans remplacer l'authentification, l'autorisation ni les vérifications en base.
- Des tests HTTP de contrôleurs isolés couvrent les nouveaux validateurs ajoutés au lot; les interactions DB et autorisations sont testées par les suites métier/E2E existantes, avec des parcours multi-route supplémentaires à poursuivre dans BL-03.

## Validation du lot

`npm test`, `npm run lint` et `npm run build` du backend doivent passer. L'E2E PostgreSQL reste exécuté par la CI (`CI=true`) et n'est pas simulé contre une base de production.
