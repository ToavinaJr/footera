# Changelog — Backend

## [Unreleased]

### Added

- CI avec PostgreSQL, migrations, seed, lint, tests et compilation.
- Image Docker de production et publication versionnée vers GHCR.
- Documentation de l’architecture, des migrations et du déploiement.

### Changed

- PostgreSQL via Prisma constitue le stockage du backend.

### Security

- Une garde HTTP globale borne et valide la structure des corps JSON (type objet, profondeur, volume et clés dangereuses).
- Les routes d’inscription, de connexion et de modification du profil rejettent maintenant les champs inattendus et valident leurs types, formats et tailles.
- Les fixtures de démonstration et leur endpoint de synchronisation sont désactivés en production.
- L’inscription d’une équipe à un tournoi est limitée à son propriétaire ou à un responsable autorisé.
- Les demandes d’adhésion sont persistées et doivent être acceptées par le staff avant l’ajout à l’effectif.
- Les réservations multi-créneaux et leurs claims sont écrits atomiquement, avec unicité PostgreSQL par terrain/date/horaire.
- L’annulation libère atomiquement le claim associé au créneau.
- Les échecs de connexion sont limités par e-mail/IP via un compteur PostgreSQL partagé entre instances.
- La création de tournoi exige le rôle organisateur et utilise le nom du compte comme identité publique.
