# Audit technique et sécurité

Date de référence : 24 octobre 2026. Cet audit est une photographie du dépôt et de son environnement local ; il ne constitue pas un audit d’intrusion ni une certification OWASP.

## Périmètre et méthode

- Lecture des modules NestJS, services métier, contrôleurs, configuration, Prisma, migrations, seed, CI et documentation frontend.
- Vérifications locales : TypeScript/build, Oxlint, tests unitaires et e2e, validation Prisma et état des migrations.
- Recherche de fichiers d’environnement suivis et de motifs de secrets dans le dépôt. Aucun fichier `.env` réel n’est suivi ; les valeurs `.env.example` et CI sont des placeholders.
- Gitleaks n’est pas installé : l’historique Git n’a donc pas reçu de scan spécialisé. Les audits npm n’ont pas pu récupérer les avis du registre réseau ; l’audit frontend est également bloqué par l’absence d’un lockfile npm utilisable.

## État observé

Le backend est NestJS + Prisma 7 + PostgreSQL. Les agrégats métier sont conservés sous forme de `id` et `payload Json` dans des tables distinctes. Cinq migrations existaient au début de l’audit. Les contrôles de session utilisent un jeton signé, un cookie `HttpOnly`, une session persistée sous forme de hash et une consommation à usage unique. Les uploads vérifient le type déclaré et la signature du fichier. Les notifications sont filtrées par destinataire.

Constats à suivre :

- `main.ts` ne configure pas de `ValidationPipe` global. Les DTOs et validations de services ne couvrent donc pas uniformément toutes les entrées.
- Les tentatives de connexion ne disposent pas de limiteur applicatif dédié. Le limiteur des uploads est en mémoire, donc local à une instance.
- La réservation vérifie la disponibilité puis écrit les réservations séparément ; aucune contrainte unique en base ne protège encore contre deux requêtes concurrentes pour le même créneau.
- Le stockage JSON d’agrégats rend certaines mises à jour concurrentes (effectifs, inscriptions, compteurs) sensibles aux écritures perdues. Une migration vers des colonnes relationnelles/contraintes est un chantier distinct.
- La documentation i18n frontend indique encore des textes français écrits directement dans certains écrans.
- Un endpoint de création de tournoi est accessible à tout compte authentifié ; son contrôle de rôle organisateur doit être clarifié et renforcé.
- Les notes vendeur et certaines dates/valeurs d’affichage du marketplace restent des valeurs de présentation codées, pas des agrégats métier fiables.

## Corrections P0 de ce lot

- Le seed de démonstration n’est plus exécuté automatiquement en production et son endpoint de synchronisation refuse la production (`seed.service.ts`).
- L’inscription d’une équipe à un tournoi vérifie que le compte est propriétaire ou responsable de l’équipe (`tournaments.service.ts`).
- Une demande pour rejoindre une équipe est maintenant enregistrée avec statut `PENDING`, sans ajout immédiat du joueur à l’effectif. Le staff propriétaire/responsable peut accepter ou refuser ; l’acceptation met à jour la demande, l’équipe et le joueur dans une transaction Prisma.
- Une migration PostgreSQL additive crée la table dédiée `team_join_requests`.

## Vérifications de référence

Les commandes locales suivantes ont réussi après les changements : backend `npm run build`, `npm test`, `npm run lint`, `npm run test:e2e`, `npx prisma validate` et `npx prisma migrate status`. Le statut de migration ne doit être vérifié que contre l’environnement explicitement configuré ; aucune base de production n’a été touchée.

Le frontend de référence avant ce lot passait `npm run lint`, `npm run test:unit` et `npm run build`.

## Limites

Les résultats des outils de dépendances sont incomplets faute d’accès au registre npm et de lockfile npm exploitable côté frontend. Les secrets dans tout l’historique restent à scanner avec Gitleaks/équivalent dans un environnement où l’outil est disponible. La validation visuelle Playwright et l’audit dynamique de production ne font pas partie de cette photographie.
