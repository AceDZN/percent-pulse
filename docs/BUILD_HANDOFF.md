# Percent Pulse — build handoff

Approved replacement direction, 24 October 2026. This is a new game, not a continuation of the canceled math prototypes. Read [CREW_COMMON.md](CREW_COMMON.md) for the shared crew, repository, asset, delivery and review requirements. Where historical briefs disagree, the latest user approval and this distinct game direction govern.

## Ownership and delivery

Work only in `/Users/acedzn/dev/AceDZN-exp/percent-pulse`. Development port **5182**; production preview port **4182**. Root creates or supplies the game's own public **AceDZN/percent-pulse** GitHub repository. Inspect the local repository and verified origin first; reuse root's repository rather than creating a duplicate. Work on `main`, make regular small descriptive commits, and push to that verified origin. Never commit secrets or add co-author/generated-by trailers. Vercel publication is a later step; do not substitute a local preview or claim a deployment that has not happened.

The builder has its own three-role crew as specified in the common brief: lead for rules/gameplay, a dedicated art/Tripo contributor, and independent QA/learning review. Give helpers non-overlapping file ownership and integrate their work. A lead working alone with an art promise does not fulfill that requirement.

Use a genuine 3D browser renderer and actual generated 3D art obtained through **Tripo in Chrome**, imported and visible in this game. The art contributor must inspect the resulting model in the real scene and keep provenance. Mathematical state, hitboxes and aim feedback must remain calibrated independently of decorative mesh bounds. Browser QA must play the production build in **Chrome**, including a complete arena run. Do not revive the old Charge Couriers game, asset brief or courier gameplay.

## Product thesis

**A responsive top-down arena shooter in which a limited percentage strike is strongest against a healthy threat, while a flat strike can finish what percentages leave alive.** The player moves, aims, dodges and chooses an attack in real time. Success is clearing a hostile arena while staying alive, not answering arithmetic to unlock shooting.

The setting is a dark, cel-shaded neon combat space. The player is a sharp luminous combat silhouette; enemies are readable aggressive geometric creatures, not friendly robots. Big color blocks, a restrained black/cyan/magenta palette, short attack trails and crisp hit recoil establish the identity. The camera follows the arena action from above at a shallow tilt. No toy factory, harbor, delivery objective, dialogue composer or room-by-room worksheet UI.

Primary actions: move with **WASD**, aim at the ground plane with the mouse, fire a flat **Bolt** with left click, fire a **Pulse** with right click or Q, and dash with Space. Add a remappable alternative for Pulse and accessible toggles for shake, flashes and motion intensity. Escape pauses without advancing the simulation. Keyboard focus, mouse coordinates and browser context-menu handling must be deliberate; a right click must not open Chrome's context menu over combat.

## Complete play loop

1. Read the shape and behavior of the enemies as they enter the arena. Their current HP is visible near them; the selected attack and its base are visible in the HUD.
2. Keep moving, aim at one threat and dodge its telegraphed attack. Dash has a visible cooldown and brief, explicitly defined invulnerability.
3. Spend one of the limited attacks. Bolt deals **18 HP** before boosts. Pulse deals **25% of the struck enemy's current HP immediately before impact**. A Pulse requires deliberate aim and a longer cooldown than Bolt.
4. Watch the actual hit: target HP before, percentage or flat operation, applied damage, remaining HP. The short receipt follows the struck enemy, rather than stopping the fight. A pause/replay panel can reveal the full calculation afterward.
5. Clear the encounter and get a short breathing space with a weapon refill and a new threat arrangement. Carry movement skill forward; do not ask the player to walk to a turn-in point.
6. After the final encounter, show survival, hits, attacks spent and the decisions made. Offer immediate replay and a changed-health variant. Do not claim learning gain from one completed run.

Aim, dodge timing and attack choice must all matter. Damage is not randomized. Enemy defenses cannot secretly rescale the base. A perfect math choice can miss, and a skilled dodge cannot conjure ammunition; receipts distinguish the reasons for an unsuccessful run.

## First playable minute

- **0–10 seconds:** the player moves around a bright central danger marker and dashes through one slow telegraphed sweep. One 18-HP skitter appears. A single Bolt hit destroys it with a satisfying impact and a brief `18 → 0` receipt.
- **10–20 seconds:** a slow **96-HP anchor** and an **18-HP skitter** appear together. Refill to four Bolts and two Pulses. Their contrasting speed and health create two different pressures.
- **20–35 seconds:** the player dodges a sweep, aims a Pulse at the anchor and sees `25% of 96 = 24; 72 HP remain`. A second Pulse now uses **72**, dealing **18** and leaving **54**. Finishing the skitter with one Bolt removes its immediate pressure without wasting a Pulse on a small base.
- **35–50 seconds:** three well-aimed Bolts remove the remaining 54 HP from the anchor. The player can interleave movement and kills; this is an example sequence, not a mandatory timing script.
- **50–60 seconds:** the arena opens into a new arrangement. A one-line optional replay shows why the second identical Pulse had a different numerical result. Continue directly to combat. No answer field, quiz gate or forced explanation appears.

The arithmetic of the example is authoritative; the exact animation timing should be tuned through play. Beginning encounters spend ammunition only on a confirmed valid enemy hit. A miss still costs cooldown and leaves the player under pressure, but cannot quietly make a first run unwinnable. Tell the player this rule. Do not add hidden automatic hits.

## Five-to-ten-minute slice

Use one polished arena with five escalating encounters, not five identical mission-select panels. Keep interludes short and make restart immediate. Enemy count, timing and movement can be tuned for control feel; the following mathematical rules and encounter health/ammunition data must remain explicit and be checked for feasibility.

| Encounter | Play change | Initial mathematical content | Guaranteed route to check |
| --- | --- | --- | --- |
| 1: First impact | Learn movement, aim and one telegraphed dodge. | One skitter, HP 18. Two Bolts, one Pulse. | One Bolt kills; Pulse alone does not finish. |
| 2: Split threats | A slow sweep enemy competes with a fast pursuer. | Anchor HP 96, skitter HP 18. Four Bolts, two Pulses. | Two anchor Pulses leave 54; three Bolts finish it, one Bolt finishes the skitter. |
| 3: Closing window | Moving enemies change aim windows while HP changes attack value. | Enemies HP 84 and 54. Six Bolts, two Pulses. | Two Pulses on 84 leave 47.25; three Bolts finish it and three finish 54. Verify other valid routes, not only this example. |
| 4: Power spike | Pick up one temporary, clearly labeled **next-hit +50% damage** charge. | Anchor HP 96 and skitter HP 27. Four Bolts, two Pulses, one boost. | Use two unboosted Pulses and three Bolts on the anchor; the boosted remaining Bolt deals 27 to the skitter. A boosted Pulse is also a legal choice; enumerate outcomes honestly. |
| 5: New pattern | A new formation provides an unhinted transfer check. | Anchor HP 120, skitter HP 36. Six Bolts, two Pulses. | Two anchor Pulses leave 67.5; four Bolts finish it, two Bolts finish the skitter. |

These are compact content seeds, not proof of balanced combat. The QA role must enumerate feasible attack allocations and test the actual timings. In particular, a **72-HP crossover describes immediate unboosted damage only**: `0.25H = 18`. Below 72, Bolt deals more immediate damage; above it, Pulse does. This does not prove a globally optimal ammunition sequence or include cooldown, aim opportunity and threat behavior. Do not teach a greedy rule as universal strategy.

Each target has a legible role and a distinct attack silhouette. Limit the slice to two enemy families plus one clear encounter modifier. No boss with undocumented armor, inventory economy, procedural levels, account system or multiplayer. Failure from player HP loss or exhausted attacks exposes a retry button and preserves a truthful event log. A help preview can show expected damage, but it is optional and its use is recorded. The transfer encounter starts with that preview off; a player can still request help without losing access to the game.

## Exact mathematics and state

- Enemy HP is a positive quantity before a hit. Pulse base is **current target HP at impact**, not spawn HP, maximum HP, player HP, or “25 percentage points.” Capture the base atomically with damage application. Two hits in one frame must serialize against the updated state.
- `rawPulseDamage = currentHp × 1/4`. A normal Bolt has `rawDamage = 18`. A single next-hit boost multiplies that attack's computed raw damage by `3/2`, then expires on a confirmed hit. For a boosted Pulse, show the two operations; it is `3/8` of current HP, not an unexplained different base.
- Applied damage is `min(rawDamage, currentHp)`. HP never goes below zero. Do not round HP between hits. Use exact rational arithmetic in the authoritative combat calculations, or a formally bounded fixed-unit representation that exactly supports every shipped multiplier and sequence. Decimal display is a view, not the stored state. State the rounding convention and show exact values in the detailed receipt.
- Percent-only damage below 100% leaves positive HP in exact arithmetic. Never silently kill an enemy at 0.1 HP or award a fictitious zero. This is why finishers are useful.
- A dead/invulnerable/out-of-range target rejects the hit clearly and cannot supply a zero or stale percentage base. A rejected hit consumes no confirmed-hit ammunition or boost. Cooldown/miss behavior is separately visible.
- Pure successive multipliers commute in the uncapped supported case: `H×0.8×1.2 = H×1.2×0.8 = 0.96H`. Never claim that order alone changes that result. This is a required domain regression test, not a combat quiz.
- Mixed flat and percentage damage can produce different results. Starting at 100 HP, Pulse then Bolt leaves **57**, while Bolt then Pulse leaves **61.5**. The additive effect explains the difference. Starting at 80, `+20%` then `−20%` leaves **76.8**, not 80; do not add the percentages. If a future cap or threshold changes order behavior, document that extra rule explicitly.
- The weapon-boost percentage has a different named base: the next hit's **raw damage**, not enemy HP directly. Current charge, current damage and maximum HP must never share an unlabeled percent bar.
- HP in this game is a fictional combat quantity. There is no claim about human physiology or real electrical energy.

Show the base in age-appropriate Hebrew: `רבע מהחיים הנוכחיים של המטרה`, alongside the numeric English-neutral HUD `25% × 96 HP`. Use real RTL layout for Hebrew and LTR containers for formulas; test mixed-direction text. Feedback should name what changed rather than label a player bad at math.

## Workbook grounding

Local structured snapshots are under `/Users/acedzn/idea-plotter/reports/math-games-2026-10-24/curriculum/`. Read their actual `blocks` when implementing help; avoid copying quiz text into the game.

- [מהו אחוז — grade 8](https://math.workbook.co.il/grade-8/chapter-5/percent-meaning): a percentage is a ratio per hundred whose absolute amount depends on its named whole. Snapshot `percent-meaning.json`.
- [אחוז שינוי — grade 8](https://math.workbook.co.il/grade-8/chapter-5/percent-change): relative change is measured against the old value. Snapshot `percent-change.json`.
- [שינויים עוקבים באחוזים — grade 8](https://math.workbook.co.il/grade-8/chapter-5/consecutive-percent-changes): multiply factors, update the intermediate base, and distinguish equal opposing percentages from inverse operations. The source explicitly states that pure factors commute. Snapshot `consecutive-percent-changes.json`.

The neon arena and weapon rules are original game design. They are not claims that Workbook authored or validated this game. Any learning conclusion beyond playtest observations needs a separate evaluation.

## Visual and audio direction

Use strong cel shading, hard-edged silhouettes, emissive accents and a mostly dark neutral arena. Flat attack is a narrow cyan snap; Pulse is a magenta impact ring with a distinct audio contour. Color is supported by shape, icon and sound. Generated enemy/player art must remain readable from the actual gameplay camera and leave attacks unobstructed.

The dedicated artist should generate a coherent combat hero or enemy silhouette through **Tripo in Chrome**, import the downloaded GLB, normalize it to the gameplay proxy, and verify its orientation, scale, contact shadow, animation strategy and GPU cost in Chrome. A screenshot of Tripo is not a visible game asset. Tiny mathematical HUDs and hitboxes are built accurately in code; do not bake text or vital target boundaries into a generated model. Avoid excessive bloom that hides shots or a cinematic camera that makes aiming uncertain.

Music is optional. Distinct attack wind-ups, confirmed hits, depleted ammunition and refill feedback are required; provide volume controls and never make audio the only source of necessary information. Impact recoil must not move the authoritative HP label unpredictably or steal aim.

## Required domain tests

1. Pulse 96 → damage 24 → HP 72; second Pulse → damage 18 → HP 54. Percent-only hits retain positive rational HP.
2. Immediate damage crossover at HP 72, including values just below and above; boosted attack changes the comparison transparently.
3. From HP 100, Pulse→Bolt = 57; Bolt→Pulse = 61.5. Pure 0.8/1.2 factors commute and produce 0.96 of the base.
4. Boosted Bolt 18×1.5 = 27; boosted Pulse 25%×1.5 = 37.5% of the captured HP. Boost expires once, on the correct confirmed event.
5. Dead targets, misses, canceled shots and same-frame impacts cannot spend confirmed-hit ammunition twice or read an old base. Overkill clamps applied damage only after raw calculation.
6. Enumerate attack allocations for all five shipped encounters using the same rules as combat. Assert at least one winning route; keep a reproducible event-log replay of one route per encounter.
7. Pausing stops timers, damage, cooldowns and enemy movement; restarting resets the encounter exactly. Repeated runs do not accumulate invisible timers or event handlers.

Tests must validate the rules, not merely mirror component rendering. Add an automated integration check that clears an encounter through actual input/event paths and compares the recorded hit receipts with domain state.

## Real Chrome acceptance checks

- Run a production build and serve it on **4182**. Inspect Chrome console/network; no missing GLB/texture, uncaught error, broken shader or asset CORS failure.
- Play the full five-encounter run with mouse aim, movement, both attacks and dash. Record evidence of each input and the final result; a static screenshot of the title screen is insufficient.
- Confirm that aim matches the projected ground position at the viewport edges and after resizing. Show a visible reticle and provide clear feedback for out-of-range/no-target shots.
- Capture the 96→72→54 receipt from actual play, one boosted hit and one failed/retried encounter. Compare event-log values, not text copied into a test fixture.
- Play the last encounter without expected-damage preview, then with help. Record help use separately. Report observed behavior without inventing student outcomes.
- Test keyboard focus, pause, restart, right-click context suppression, a narrow viewport, Hebrew/formula direction, disabled flashes and muted audio. A documented desktop-only control scope is acceptable; a broken small viewport is not.
- Verify the generated Tripo model is on-screen in combat with correct proxy alignment and readable target silhouettes. Measure the actual scene on the host browser and report performance with hardware/viewport context; do not claim a universal frame rate.
- Independent QA must report both a math problem and a gameplay problem if found, stop false-success reporting, and rerun the affected path after fixes. Deliver the repo URL, commits, local run commands, asset provenance, playable evidence and known limitations as required by the common brief.

No novelty measurement or formal Idea Plotter gate approval is asserted by this handoff. The success criterion for this slice is a distinct, playable, mathematically honest arena combat game that has actually been played in Chrome.
