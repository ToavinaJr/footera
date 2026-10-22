# Architecture frontend

L’application est une SPA React/TypeScript compilée par Vite. Les pages et composants présentent les domaines fonctionnels ; les appels réseau passent par le client API partagé et les modules de services. L’état utilisateur transversal est géré par le contexte applicatif.

Le code utilise `@` comme alias racine. Les routes consomment le préfixe `/api/v1`; le backend reste responsable de la validation et de la persistance. Garder l’interface séparée de la logique réseau et centraliser les erreurs dans le client API.

Pour le proxy local et les variables d’environnement, voir [configuration.md](configuration.md).
