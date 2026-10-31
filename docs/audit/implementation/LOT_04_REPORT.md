# Rapport Lot 04 — Contrat i18n typé et fallback

**Statut : NEEDS_REVIEW** · **BL-06 : critères fonctionnels locaux couverts; exit Playwright propre en attente**

## Modifications

- La fonction `t()` utilise désormais `MessageKey`, union dérivée du dictionnaire français; les appels à une clé absente sont détectés par TypeScript.
- Une clé invalide dans le flux de modification d'une demande d'équipe (`profile.teamRequestUpdateError`) a été corrigée vers la clé déclarée `profile.teamRequestEditError`.
- `translateMessage()` centralise le choix de langue, le fallback français et l'interpolation. Une clé inconnue au runtime renvoie son identifiant et ne déclenche pas de `replaceAll` sur `undefined`.
- Quatre tests couvrent l'interpolation, la résolution dans la langue demandée, la clé inconnue, la parité des clés entre les trois langues et les placeholders.
- Un scénario Playwright confirme que la langue sélectionnée est conservée après reload.

## Validation

- `npm run lint` (TypeScript) : réussi.
- `npm run test:unit` : réussi, 15 tests cumulés à travers les suites frontend.
- `npm run build` : réussi.
- Le scénario navigateur de persistance affiche `ok`, mais le runner ne quitte pas proprement après le test (même blocage de teardown Windows observé sur les autres suites).

## Réserves

- Le comportement si `localStorage` lève une exception reste sans test dédié.
- Aucun contenu de traduction n'a été réécrit dans ce lot.
