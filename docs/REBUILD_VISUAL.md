# Percent Pulse — visual rebuild plan

Planning only. No source changes or asset generation are authorized by this document. The lead owns the new imagegen gameplay mockups and Git; implementation starts after the crew inspects those images and derives the layout/asset plan from them.

The user rejected the existing flow and controls as confusing, hard, and boring, and requested a full replan/rebuild with mockup screenshots first. This plan addresses that feedback as a design hypothesis. Automated checks cannot establish that the revised game is enjoyable.

## Recommended direction

A compact neon arcade arena with movement as the continuous action, automatic targeting/basic fire, and one deliberate, large **פעימה · 25%** action. Short waves clear immediately when the last enemy falls. The world communicates the selected target, incoming danger, the hit, and the wave ending. Exact HP rules remain in authoritative state.

This direction is provisional pending the lead's user-choice result and new mockups. Manual aiming can remain an optional later mode; it should not determine the default composition.

| Flow option | Visual/control treatment | Tradeoff to review |
| --- | --- | --- |
| **Movement arcade — recommended** | Move with arrows/WASD or one stick; auto-target/basic fire; one deliberate Pulse button. Close camera, short waves, readable reactions. | Lowest simultaneous input load of the continuous-action options. Auto-fire cadence still needs to preserve a meaningful percentage choice. |
| **Pointer-destination arcade** | Click/tap the floor to move; automatic combat; Pulse remains an explicit button/key. A single clear destination marker replaces an aiming reticle. | Reduces keyboard dependence, but pathing and accidental movement toward an enemy can introduce a new source of confusion. Prototype before choosing it. |
| **Deliberate slow action** | The same compact world, slower threat windups, short attack opportunities and more breathing room around a Pulse choice. | Gives more time to read HP, but repeated stops could weaken the continuous arcade rhythm. The user should see this pacing in a storyboard or short prototype before committing. |

## What the current captures reveal

Inspected `docs/evidence/pulse-72.png` (1672×941), `touch-portrait.png` (390×844), the current scene camera, and the live HUD construction.

| Observation | Rebuild implication |
| --- | --- |
| The player and generated anchor occupy a small fraction of a large floor. On portrait, the player is especially small. | Frame the actors first. Reduce the combat footprint and move the camera closer. Decorative arena edges may be cropped. |
| Pylons, channels, live threats, and danger geometry share bright pink. | Dim environmental pink. Reserve strong contrast for actors and active warnings. |
| The same target appears in a top readout, world HP label, damage preview, and adjacent receipt. | Keep current HP above the enemy and one brief actual-hit receipt. |
| The UI exposes movement, mouse aim, two attacks, dash, boost, finite ammo, a survival timer, and settings. | The default view should orient around movement and one Pulse action. Expose other controls only if the redesigned rules require them. |
| The objective still asks the player to survive after all threats are gone. | Show an immediate clear reaction and start the next short wave; visual pacing should follow the player's result. |
| The cyan body and magenta sentinel are recognisable, locally bundled 3D assets. | Reuse them at a readable size. Additional models are unnecessary for the first rebuild. |

These observations explain concrete presentation costs. They are not a claim that a screenshot alone explains the user's entire experience.

## Camera and world composition

Start the mockup around a compact playable footprint of approximately **9×6 world-unit radii**, rather than preserving the old 17×12 arena as a requirement. Initial perspective-rig exploration: **38–42° vertical FOV, 55–60° elevation, distance 20–24**. These are starting values to tune against the image, not locked implementation numbers.

Judge the result in screen pixels at **1280×720**:

- Player: approximately **85–110 px tall**, lower-middle of the action area.
- Anchor: approximately **140–180 px wide**, with its central eye and full HP label visible.
- Skitter: approximately **55–75 px wide**, visibly smaller and faster than the anchor.
- Active target and approaching threat fit in the same view with room to move between them.
- Background columns sit at the margins; floor detail stays quiet beneath warning geometry.

Use a stable camera for the opening waves. If follow is needed, use a dead zone and soft bounds so a direction change does not move the whole picture. Hit feedback must not shift the camera. Reduced effects removes shake and large scale flashes while retaining damage numbers, target reaction, and warning timing.

The portrait mockup must establish its own framing. Do not obtain it by pulling the camera back until the complete desktop arena is tiny. Keep the player/active target legible, crop decorative architecture, and reserve most of the height for play. Threat spawning and warnings must remain inside the visible action area. Any responsive world/boundary choice belongs to the lead and must agree with state; it must not change halfway through a wave on resize.

## Minimal HUD and target language

| Location | Content |
| --- | --- |
| Bottom-left | Compact player HP bar with a heart/shield shape and the current value. |
| Top-center | Current wave and the number of threats remaining. |
| Bottom-right | One large **פעימה · 25%** button with its actual availability/count and one keyboard hint. On touch, a comfortable thumb target. |
| Above the chosen enemy | Current HP / maximum HP and a clear target bracket. |
| At the confirmed hit | One brief receipt such as `25% × 96 = 24`, followed by `96 → 72`; then it clears. |
| Pause/settings | Secondary controls, audio/reduced effects, help and the detailed hit log. |

Introduce the basic automatic **18 HP** attack once through a short caption and its visible hit number. Show its finite resource only if the revised game still uses finite Bolts. Do not carry the old ammo panels, dash cooldown, boost button, survival countdown, and duplicate target card into the new default view by habit.

Automatic targeting needs an explicit visual contract: one bracketed enemy, a visible facing direction, and a brief readable target handover. Pulse must clearly act on that same selected enemy. A moving auto-Bolt can change the percentage base before the player presses Pulse; show the real current base and avoid presenting an earlier preview as a guaranteed result. The lead must resolve the firing cadence/target-lock rule before the mockup is treated as an interaction specification.

Default copy is short Hebrew; quantities and formulas remain isolated LTR. Possible first instruction: **זוזו עם החצים. הירי אוטומטי.** Then introduce **פעימה מורידה 25% מהחיים שנותרו.** Do not put a paragraph over the opening fight.

## Feedback and moment-to-moment motion

1. **Basic hit:** a short cyan streak, a clear `18` damage number, a small target recoil, and an immediate HP-bar change.
2. **Pulse:** a distinct ring/beam converges on the bracketed enemy, the model compresses/recoils, `24` is prominent, and the changing base appears once beside it. Whole-object animation is sufficient for the static GLB; no rig is claimed.
3. **Incoming attack:** one warm filled warning shape with an advancing edge, then the strike. Its geometry agrees with state. Avoid overlapping several warning grammars during the opening wave.
4. **Enemy defeat:** the body folds/shrinks or splits into a few brief shards, the HP label disappears, and the remaining-threat count changes immediately.
5. **Wave clear:** an unmistakable short world pulse and a compact **גל הושלם** cue, followed by the next wave without a prolonged modal or empty survival phase.
6. **Player hurt/recovery:** a short shield break cue, bounded invulnerability feedback, and a clear route back into play. The death screen should prioritise immediate retry; a detailed math log is optional.

Keep these motions readable with audio muted. Audio reinforces the action rather than supplying the only warning. Any hit-stop or timing adjustment must also work through deterministic stepping and respect reduced effects.

## Asset reuse and art budget

- Reuse `public/models/pulse-sentinel.glb` as the large anchor. It is already a real Chrome/Tripo output, locally bundled and optimised to 35,988 triangles / 2,367,328 bytes. Increase its visible screen presence, with the collider/targeting ring kept authoritative and visually consistent.
- Reuse the cyan duelist and pointed skitter meshes, enlarging the readable body/face/weapon features. Their reactions can use whole-body transforms.
- Reuse stone-sector geometry, a small portion of the low rim, and a few pylons. Reduce environmental contrast and repeated columns so the actors dominate.
- Keep typography, HP bars, target brackets, warning surfaces, shot geometry, and receipts procedural.
- **No additional Tripo spend or new generation is proposed for this rebuild plan.** Existing provenance stays in `ASSETS.md`; new mockups are labelled generated design targets, never actual gameplay evidence.

## Mockup sequence before implementation

The lead should generate and save the exact prompt for these views, then the crew should extract camera, layout, sizes, asset needs, and interaction states from them:

1. **Opening action:** the cyan player is clearly identifiable, one basic threat is being automatically targeted, movement is obvious, and the one Pulse action is visible. Minimal HUD, no tutorial sheet.
2. **Deliberate percentage hit:** a large anchor goes `96 → 72` after `25% × 96 = 24`, with the player, auto-target bracket, one approaching skitter, and the Pulse control visible. The numbers must agree with the illustrated moment.
3. **Result/next wave:** the last threat has just fallen, a short clear cue appears, and the next wave is about to enter. This image tests the intended immediate-clear flow.

Also inspect a portrait composition before claiming the desktop layout is ready for touch. If only two primary images are generated initially, prioritise opening action and the percentage hit; the lead can storyboard the clear transition in prose until its visual target is available.

## Review contract

Before code, review whether the images make the player, current target, incoming danger, and Pulse action easy to locate. Ask the user to critique those concrete images; do not interpret a generated image as approval of the controls.

After implementation, capture matching real browser states and compare actor pixel sizes, camera framing, HP, target indication, button placement, warning coverage and hit/result feedback. Exercise an opening wave, a mistaken Pulse, immediate clear, hurt/retry, touch movement and pause. Confirm that the real screenshot contains the promised interaction state. Separate this verification from any human judgement about enjoyment or learning.
