# Architecture frontend

L’application est une SPA React/TypeScript compilée par Vite. Les pages et composants présentent les domaines fonctionnels ; les appels réseau passent par le client API partagé et les modules de services. L’état utilisateur transversal est géré par le contexte applicatif.

La navigation est déclarative via React Router : `/` (accueil), `/players`, `/teams`, `/matches`, `/tournaments`, `/pitches`, `/recruitment`, `/marketplace`, `/profile` et `/stats`. Les détails sont accessibles sous `/teams/:teamId`, `/matches/:matchId`, `/recruitment/:adId`, `/pitches/:pitchId`, `/marketplace/:listingId` et `/tournaments/:tournamentId`. Les créations utilisent `/pitches/new`, `/marketplace/new` et `/tournaments/new` ; `/profile/edit-cv` ouvre l’édition du CV et `/profile/bookings/:bookingId` pointe une réservation. `/notifications` ouvre le centre d’alertes comme une route modale et conserve la page précédente en arrière-plan. Les routes inconnues redirigent vers l’accueil. Les modales routées supportent les liens directs et le bouton précédent/suivant.

Le code utilise `@` comme alias racine. Les routes consomment le préfixe `/api/v1`; le backend reste responsable de la validation et de la persistance. Garder l’interface séparée de la logique réseau et centraliser les erreurs dans le client API.

Pour le proxy local et les variables d’environnement, voir [configuration.md](configuration.md).
