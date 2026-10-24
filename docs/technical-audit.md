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
- Les échecs de connexion sont maintenant limités par couple e-mail/IP avec un compteur PostgreSQL partagé (10 échecs par fenêtre fixe de 15 minutes). Le limiteur des uploads reste en mémoire, donc local à une instance.
- Les claims de créneaux sont maintenant protégés par une contrainte unique et une transaction batch. L’idempotence d’une même requête HTTP (rejeu après perte de réponse) reste à ajouter.
- Le stockage JSON d’agrégats rend certaines mises à jour concurrentes (effectifs, inscriptions, compteurs) sensibles aux écritures perdues. Une migration vers des colonnes relationnelles/contraintes est un chantier distinct.
- La documentation i18n frontend indique encore des textes français écrits directement dans certains écrans.
- Un endpoint de création de tournoi est accessible à tout compte authentifié ; son contrôle de rôle organisateur doit être clarifié et renforcé.
- Les notes vendeur et certaines dates/valeurs d’affichage du marketplace restent des valeurs de présentation codées, pas des agrégats métier fiables.

## Corrections P0 de ce lot

- Le seed de démonstration n’est plus exécuté automatiquement en production et son endpoint de synchronisation refuse la production (`seed.service.ts`).
- L’inscription d’une équipe à un tournoi vérifie que le compte est propriétaire ou responsable de l’équipe (`tournaments.service.ts`).
- Une demande pour rejoindre une équipe est maintenant enregistrée avec statut `PENDING`, sans ajout immédiat du joueur à l’effectif. Le staff propriétaire/responsable peut accepter ou refuser ; l’acceptation met à jour la demande, l’équipe et le joueur dans une transaction Prisma.
- Une migration PostgreSQL additive crée la table dédiée `team_join_requests`.
- Les réservations créent maintenant les réservations et leurs claims de créneau dans une transaction ; la contrainte unique garantit qu’une seule requête concurrente remporte le créneau. L’annulation libère le claim dans la même transaction que le changement de statut.
- Les échecs de connexion sont comptés par clé hachée e-mail/IP dans PostgreSQL ; la clé ne contient pas de donnée brute, le compteur est partagé entre répliques et les entrées expirées sont nettoyées.
- La création d’un tournoi exige maintenant le rôle `Organisateur Tournoi` et son nom public vient du profil authentifié plutôt que d’un champ arbitraire fourni par le client.

## Vérifications de référence

Les commandes locales suivantes ont réussi après les changements : backend `npm run build`, `npm test`, `npm run lint`, `npm run test:e2e`, `npx prisma validate` et `npx prisma migrate status`. Des tests directs sur PostgreSQL local ont vérifié un seul gagnant sur des claims de créneau concurrents et le comptage atomique de tentatives ; les lignes temporaires ont été supprimées. Les migrations ont été appliquées uniquement à la base locale `127.0.0.1:55432` ; aucune base distante n’a été touchée.

Le frontend de référence avant ce lot passait `npm run lint`, `npm run test:unit` et `npm run build`.

## Limites

Les résultats des outils de dépendances sont incomplets faute d’accès au registre npm et de lockfile npm exploitable côté frontend. Les secrets dans tout l’historique restent à scanner avec Gitleaks/équivalent dans un environnement où l’outil est disponible. La validation visuelle Playwright et l’audit dynamique de production ne font pas partie de cette photographie.
