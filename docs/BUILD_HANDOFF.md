# Percent Pulse — build handoff

> **Current Percent Pulse authority:** The owner requested a full replan after playing v1. [The v2 plan](rebuild-v2/PLAN.md) supersedes Percent Pulse’s original manual aiming, finite ammunition, dash/boost, fixed survival timers and five-encounter duration target. The real 3D, exact math, existing Chrome-Tripo asset, separate public repository and crew/evidence requirements remain. The original brief below is retained as history.

Approved replacement, 24 October 2026. Read [CREW_COMMON.md](CREW_COMMON.md), including the user's exact instruction and three-role crew: gameplay/rules lead, dedicated art/Tripo contributor, independent QA/learning reviewer. Assign separate file ownership and integrate their work. This is a new arena shooter; canceled prototypes remain stopped.

## Repository and delivery

Work in `/Users/acedzn/dev/AceDZN-exp/percent-pulse`. Root has created and verified public **AceDZN/percent-pulse**; inspect and reuse its existing origin. Use `main`, regular small descriptive commits and pushes. No duplicate repository, secrets or co-author/generated-by trailers. Dev **5182**, production preview **4182**. Vercel publication is later; do not invent deployment status.

The approved requirements include genuine **3D browser gameplay**, actual **Tripo generation through Chrome**, an imported visible generated model, and real **Chrome play verification**. The common brief governs evidence and final reporting.

## Identity, controls and loop

A responsive top-down arena shooter: **dodge, aim and spend limited fixed-damage or current-health-percentage attacks**. Clear hostile encounters while staying alive. Mathematics changes damage decisions during combat; there is no arithmetic answer field or quiz gate.

Use sharp cel-shaded combat silhouettes, dark neutral ground, cyan/magenta impacts, hard-edged neon enemies and a shallow overhead follow camera. No toy industry, harbor, courier, dialogue composer or friendly robot errands. Distinct telegraphed sweeps and fast pursuers create pressure.

WASD moves, mouse aims, left click fires **Bolt**, right click/Q fires **Pulse**, Space dashes, Escape pauses. Suppress the browser context menu during play. Show dash cooldown/invulnerability, targeting reticle, ammunition and HP. Offer remapping, reduced flashes/shake and volume controls. Shapes/icons reinforce color.

Move and aim → choose attack → dodge retaliation → read a brief actual-hit receipt → clear encounter → refill during a short interlude → face a new pattern. Restart is immediate. Beginning shots consume ammunition only on a confirmed valid hit; misses cost cooldown and opportunity, not hidden unwinnability. State that rule. Damage is deterministic.

## First minute and content

First ten seconds: dash through a telegraphed sweep and Bolt an 18-HP skitter. Then a **96-HP slow anchor** and **18-HP fast skitter** appear. Pulse the anchor: `25% of96=24`, leaving72. A second Pulse uses72, dealing18 and leaving54. One Bolt removes the skitter; three finish the anchor while the player keeps dodging. A short optional replay explains the changed base. Continue into combat without a worksheet.

One polished arena contains five encounters across **5–10 minutes**, not repeated mission-select rooms:

| Encounter | HP; ammunition | Example feasible allocation |
| --- | --- | --- |
| 1, first impact |18; Bolt2/Pulse1|One Bolt.|
| 2, split threats |96+18; Bolt4/Pulse2|Two Pulses then three Bolts on96; one Bolt on18.|
| 3, closing window |84+54; Bolt6/Pulse2|Two Pulses leave47.25 on84; three Bolts finish each target.|
| 4, power spike |96+27; Bolt4/Pulse2; one next-hit +50% boost|Two normal Pulses/three Bolts on96; boosted remaining Bolt deals27.|
| 5, transfer pattern |120+36; Bolt6/Pulse2|Two Pulses leave67.5; four Bolts finish120, two finish36.|

These are checked arithmetic examples, not proof of balanced combat. Verify allocations and tune enemy timing/aim windows through play. Encounter5 uses new formation/values, no highlighted weapon and expected-damage preview initially off. Optional help remains available; log its use. Limit scope to two enemy families and one boost. Failure exposes a truthful log and quick retry.

## Authoritative math

Bolt deals **18HP**. Pulse deals **25% of target CURRENT HP at impact**, atomically captured before that hit. A next-hit boost multiplies raw damage by1.5 and expires on confirmed impact: Bolt27; boosted Pulse37.5% of the captured HP. Show the boost's named base, raw attack damage.

Use exact rational HP/calculations, or a proven exact fixed-unit representation supporting every shipped sequence. Never round between hits; display rounding cannot change state. Applied damage is `min(rawDamage,currentHP)`; HP cannot be negative. Invalid/dead targets consume neither confirmed-hit ammunition nor boost. Same-frame hits serialize against updated HP.

Percent-only damage below100% never reaches zero in exact arithmetic: no invisible low-HP kill threshold. The **72HP crossover** describes immediate unboosted damage only (`0.25H=18`), not universally optimal ammunition strategy or cooldown value.

From100: Pulse→Bolt leaves57; Bolt→Pulse leaves61.5. The additive effect explains order sensitivity. Pure multipliers commute: `H×0.8×1.2=H×1.2×0.8=0.96H`; +20% then−20% does not restore the original. Do not invent order sensitivity without an explicit additional rule. Show positive percentage bases, not percentage points or maximum HP.

## Sources, art and verification

Read actual saved blocks in `/Users/acedzn/idea-plotter/reports/math-games-2026-10-24/curriculum/`:

- [מהו אחוז](https://math.workbook.co.il/grade-8/chapter-5/percent-meaning): named whole/base.
- [אחוז שינוי](https://math.workbook.co.il/grade-8/chapter-5/percent-change): old-value denominator.
- [שינויים עוקבים](https://math.workbook.co.il/grade-8/chapter-5/consecutive-percent-changes): multiply factors; pure factors commute.

Hebrew guidance suits ages13–14; formulas use LTR containers inside proper RTL UI. The combat fiction is original; Workbook has not validated the game.

The artist generates a coherent combat hero/enemy in **Tripo through Chrome**, downloads/imports its actual GLB, then checks scale, orientation, lighting and readability from the gameplay camera. A screenshot or unused model is insufficient. Accurate hitboxes, typography and mathematical values come from code, not mesh dimensions. Retain asset provenance.

Required domain tests: 96→72→54; crossover; mixed versus pure operations; boost consumption; exact fractions/overkill; invalid targets; simultaneous impacts; pause/restart; feasible allocations and replay for all encounters.

In **Chrome production preview4182**, play all encounters using real controls, inspect console/network and capture actual HP receipts, boost use, failure/retry and the unhinted transfer. Test viewport-edge aim/resizing, focus, context-menu suppression, RTL/formulas, muted audio and reduced effects. Confirm generated art is visible during combat. Report measured performance with host/viewport context, independent QA findings, fixes/rechecks, public repo/commits and playable evidence. No invented student outcomes, measured novelty or gate approval.
