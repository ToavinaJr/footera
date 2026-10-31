# Rapport Lot 08 — Limitation persistante des inscriptions

**Statut : NEEDS_REVIEW** · **BL-05 : limite de base implémentée**

## Décision de politique

- Quota retenu : **20 inscriptions valides par adresse IP sur une fenêtre d'une heure**.
- Motif : assez permissif pour un petit club/lieu de travail derrière une IP partagée, mais borne le coût de création et le hashing de mots de passe depuis une instance.
- Le quota est appliqué après validation du nom/e-mail/mot de passe et avant recherche d'identifiant, dérivation du hash et écritures.
- Aucun quota par e-mail : il pourrait permettre un déni de service ciblé sur une victime; les conflits de doublon continuent à être traités normalement.
- La clé persistée est une empreinte SHA-256 préfixée par le contexte et non l'adresse brute. La limitation est partagée entre instances via le mécanisme PostgreSQL existant.

## Modifications

- `AuthController` transmet `request.ip` (fallback socket) au service d'authentification.
- `AuthService.register()` applique le quota et renvoie HTTP 429 après dépassement.
- Test unitaire : succès au premier essai, rejet en dépassement, format de clé hachée et aucune seconde écriture de compte.

## Validation

- Test ciblé AuthService : 8 tests réussis.
- Suite backend complète : 179 tests dans 43 fichiers réussis.
- Oxlint et build backend : réussis.
- Test multi-instance du compteur est déjà prévu dans l'E2E PostgreSQL commun; l'exécution réelle reste conditionnée au workflow CI (`CI=true`).
- Aucun schéma, migration, déploiement ou accès à la base de production.

## Risques et suivi

- L'adresse IP dépend de la configuration `TRUST_PROXY_HOPS`; vérifier que l'environnement de déploiement expose l'IP client correctement.
- Les réseaux partagés peuvent atteindre le seuil; monitorer les 429 sans stocker l'IP ou l'e-mail et ajuster le seuil à partir de mesures réelles.
- Une attaque distribuée peut contourner une limite par IP; CAPTCHA ou réputation ne sont pas ajoutés sans preuve de besoin utilisateur/abus.
