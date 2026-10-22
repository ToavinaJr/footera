# Architecture frontend

L’application est une SPA React/TypeScript compilée par Vite. Les pages et composants présentent les domaines fonctionnels ; les appels réseau passent par le client API partagé et les modules de services. L’état utilisateur transversal est géré par le contexte applicatif.

La navigation est déclarative via React Router : `/` (accueil), `/players`, `/teams`, `/matches`, `/tournaments`, `/pitches`, `/recruitment`, `/marketplace`, `/profile` et `/stats`. Les identifiants d’équipe et de terrain peuvent être adressés sous `/teams/:teamId` et `/pitches/:pitchId`. Les routes inconnues redirigent vers l’accueil. Les changements de page utilisent l’historique navigateur, donc précédent/suivant et liens directs fonctionnent.

Le code utilise `@` comme alias racine. Les routes consomment le préfixe `/api/v1`; le backend reste responsable de la validation et de la persistance. Garder l’interface séparée de la logique réseau et centraliser les erreurs dans le client API.

Pour le proxy local et les variables d’environnement, voir [configuration.md](configuration.md).
