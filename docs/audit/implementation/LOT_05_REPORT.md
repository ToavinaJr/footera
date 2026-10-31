# Rapport Lot 05 — Accessibilité des formulaires d'authentification

**Statut : NEEDS_REVIEW** · **BL-07 : couverture initiale ajoutée**

## Modifications

- Nouveau test Playwright pour les formulaires connexion et inscription.
- Vérifications de présence des champs via rôles/labels accessibles et analyse `@axe-core/playwright`.
- Le projet lance les deux scénarios en desktop et mobile, sans ajouter ni modifier de baseline screenshot.

## Validation

- Les quatre variantes (deux formulaires × deux viewports) ont affiché `ok`; axe n'a signalé aucune violation.
- `npm run lint` (TypeScript) : réussi.
- `git diff --check` : réussi.
- Le processus Playwright est resté bloqué après le quatrième test et n'a pas rendu son résumé final; interrompu manuellement. Le résultat doit être confirmé par un run CI qui termine proprement.

## Suite

- Diagnostiquer le teardown Windows/Playwright déjà observé sur les suites précédentes.
- Étendre axe aux formulaires équipe, réservation et marketplace, puis couvrir clavier/focus et états d'erreur.
