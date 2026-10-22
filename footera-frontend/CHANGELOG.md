# Changelog — Frontend

## [Unreleased]

### Fixed

- Rendre les scripts Vite indépendants des exécutables Bun endommagés dans `node_modules` et corriger les exports incompatibles avec Fast Refresh.

### Added

- Routage client React Router pour chaque espace de l’application et prise en charge des URLs directes.
- CI de vérification TypeScript et build de production.
- Image Nginx avec proxy API configurable et publication GHCR.
- Documentation d’architecture et de configuration API.

### Changed

- Exemple d’environnement aligné sur le mode API par défaut.
