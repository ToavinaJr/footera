# Rapport Lot 07 — Publication GHCR après CI réussie

**Statut : NEEDS_REVIEW** · **BL-12 : gate CI implémenté, exécution réelle en attente**

## Changements

- CI déclenchée sur les push de tags `v*` en plus des PR et branches principales.
- La release démarre via `workflow_run` du workflow `CI`; le job ne publie que pour une conclusion réussie et un `head_branch` commençant par `v`.
- Le checkout et les étiquettes Docker utilisent le `head_sha` / `head_branch` du run CI terminé. Le déclenchement manuel et la publication immédiate sur push de tag ont été supprimés.
- Mise à jour du backlog et des constats DevOps pour distinguer l'ancien défaut et la mitigation actuelle.

## Validation

- `git diff --check` : réussi.
- Pas d'analyseur GitHub Actions/YAML installé dans l'environnement; syntaxe revue via diff, mais non validée par `actionlint`.
- Aucun workflow distant n'a été déclenché. Le premier tag doit vérifier `head_branch`, les tags semver, la publication sur le SHA attendu et le skip après CI échouée.

## Résiduel

Les actions sont toujours référencées par tags majeurs. Le pinning SHA, SBOM, scan d'image, signature/provenance, digests consommés et règles de protection des tags restent ouverts.
