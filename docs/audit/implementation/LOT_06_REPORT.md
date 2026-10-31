# Rapport Lot 06 — Gate de publication des images

**Statut : NEEDS_REVIEW** · **BL-12 : première tranche implémentée**

## Modifications

- Le workflow CI s'exécute désormais aussi sur les tags `v*`.
- La publication attend l'événement `workflow_run` du workflow nommé `CI` et n'exécute le job que si sa conclusion est `success` et le nom du ref commence par `v`.
- Le checkout de release utilise `workflow_run.head_sha`, avec l'historique/tags récupérés pour générer les tags semver et `latest`.
- La publication manuelle et directe sur push de tag a été retirée pour ne pas contourner le gate CI.

## Validation et limites

- `git diff --check` : réussi.
- Les workflows ne peuvent pas être réellement déclenchés depuis cet environnement; le premier tag de validation doit confirmer la chaîne CI → release et les tags produits dans GHCR.
- Le statut de CI complète est donc **non vérifié**. Les actions restent référencées par tags majeurs; SHA pin, SBOM, scan et signature sont hors de cette tranche.

## Risques à surveiller

- Vérifier dans le run de tag que `workflow_run.head_branch` correspond au nom du tag `v*` attendu.
- Confirmer que les métadonnées Docker produisent bien le tag complet, `major.minor` et `latest`, tous sur le SHA CI réussi.
- En cas d'échec ou de métadonnée incorrecte, la publication doit rester bloquée et le workflow être corrigé avant de réactiver une release.
