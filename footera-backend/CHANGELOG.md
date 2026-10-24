# Changelog — Backend

## [Unreleased]

### Added

- CI avec PostgreSQL, migrations, seed, lint, tests et compilation.
- Image Docker de production et publication versionnée vers GHCR.
- Documentation de l’architecture, des migrations et du déploiement.

### Changed

- PostgreSQL via Prisma constitue le stockage du backend.

### Security

- Les fixtures de démonstration et leur endpoint de synchronisation sont désactivés en production.
- L’inscription d’une équipe à un tournoi est limitée à son propriétaire ou à un responsable autorisé.
- Les demandes d’adhésion sont persistées et doivent être acceptées par le staff avant l’ajout à l’effectif.
- Les réservations multi-créneaux et leurs claims sont écrits atomiquement, avec unicité PostgreSQL par terrain/date/horaire.
- L’annulation libère atomiquement le claim associé au créneau.
- Les échecs de connexion sont limités par e-mail/IP via un compteur PostgreSQL partagé entre instances.
- La création de tournoi exige le rôle organisateur et utilise le nom du compte comme identité publique.
