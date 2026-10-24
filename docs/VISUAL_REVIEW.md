# Generated target versus playable build

Independent review, 24 October 2026. The image in `visual-targets/` is a **generated design target**. Images in `evidence/` are actual browser captures of the implemented Three.js game. The generated bitmap is not used as the playable scene.

## Comparable primary state

- Target: [gameplay-v1.png](visual-targets/gameplay-v1.png), **1672 × 941**. Prompt and camera correction: [PROMPT.md](visual-targets/PROMPT.md).
- Actual: [pulse-72.png](evidence/pulse-72.png), **1672 × 941, DPR 1**, production preview `http://localhost:4182`, Google Chrome.
- Shared mathematical witness: encounter **2 / 5**; player **100 HP**; anchor **72 / 96 HP** after a **25% × 96 = 24** hit; live skitter **18 HP**; ammunition **4 Bolts / 1 Pulse**. The actual screenshot's receipt, HP label, ammunition, and target preview agree.
- Actual camera: shallow player follow, approximately **55°** elevation, perspective projection, with the whole playable floor visible. Pointer projection uses this same camera.

| Review area | Implemented agreement | Visible difference / limit |
| --- | --- | --- |
| Scene and framing | Raised elliptical stone arena, low segmented rim, pink channels/crystal pylons, blue-black floating architecture, elevated whole-arena view. | The target has denser broken architecture and a more dramatic surrounding void. The build uses simpler repeated columns and a cleaner floor composition. |
| Silhouettes | Cyan controllable combatant, magenta generated anchor, smaller pointed skitter; separate readable targeting rings. | The target's large hulking humanoid anchor is represented by a smaller static hovering armored sentinel. The player and skitter use simpler procedural meshes. These are not rigged recreations. |
| Real 3D assets | The imported Chrome/Tripo GLB is visible as the magenta anchor in the actual captures; depth, ground contact, lighting, facing, and world labels come from the live scene. | Decorative model geometry is not authoritative collision geometry. Asset chronology, normal GLB export, processing, hashes, and limitations are in [ASSETS.md](../ASSETS.md). The target arrived after the original Tripo task had been submitted; no retroactive image-first claim is made. |
| HUD hierarchy | Health/dash bottom-left, finite weapons bottom-right, encounter bottom-center, compact world-adjacent receipt and current/max anchor HP. The skitter's full-HP bar is filled consistently. | The build also shows a compact top target readout and survival-cycle objective. Its rectangular controls are quieter than the illustrated weapon cards. |
| Hebrew and formulas | Hebrew is the default UI. Weapon labels include ברק / פעימה. Formula groups are isolated LTR; the actual `25% × 96 = 24`, `72 / 96`, and boosted `18 × 1.5 = 27` read in the correct order. | English attack aliases remain for the input guide. Small secondary text is less prominent than the generated reference. |
| Input and action | Actual movement, aiming, finite flat/percentage shots, dash, pause, failure, and retry change the scene/state. UI controls were independently exercised rather than inferred from the image. | A screenshot alone does not demonstrate action parity; the action scripts and QA evidence below supply that separate evidence. |
| Hit feedback | State-driven shot beam, magenta percentage impact, target HP change, ammunition decrement, and adjacent receipt. Raw and applied damage are named separately. | The target has a larger starburst, more bloom, and a cyan trail at its illustrated percentage hit. The live percentage shot is magenta and its impact is more restrained. |
| Threat feedback | Actual magenta floor arc, strip sweeps, and burst warnings charge before damage. Sector/radial geometry is shared with the authoritative rules. | The target illustrates a broad glowing sector. The build's arc is an exact annular band with restrained opacity, plus two additional warning shapes. |
| Depth and lighting | Cel shading, dark stone, emissive cyan/magenta accents, occlusion, floating structure, contact rings, and perspective depth are visible in actual play. | Texture detail is procedural grain/cracks rather than the target's painted rubble. No pixel-identical reconstruction is claimed. |

## Additional action and recovery evidence

[arc-telegraph.png](evidence/arc-telegraph.png) is an actual **1672 × 941** capture reached by moving through live encounter 2 after the first Pulse. It shows the charged curved danger band while the anchor remains **72 / 96**, skitter **18 HP**, player **88 HP** after contact damage, and ammo **4 / 1**. This supplies the floor-arc evidence absent from the instantaneous primary hit frame.

[boost-27.png](evidence/boost-27.png) shows a confirmed next-hit boost, **18 × 1.5 = 27**, applied **27 HP**, with **0 HP** remaining on the 27-HP skitter. [failure.png](evidence/failure.png) shows a real no-input defeat and an immediate retry control. Its empty attempt receipt log does not misrepresent a prior attempt's killing shot. [transfer.png](evidence/transfer.png) records the final changed-value encounter with expected-damage preview initially disabled; the final formation is verified in the state/browser checks.

The visual contributor also captured real user-Chrome input and failure states: [chrome-manual-inputs.jpg](evidence/chrome-manual-inputs.jpg), [chrome-manual-failure.jpg](evidence/chrome-manual-failure.jpg). These are actual browser images, not generated mockups.

## Review fixes and checks

The first playable capture had a rectangular grid slab, small silhouettes, corner-fixed receipt, and stale HUD during immediate deterministic captures. Review drove the stone ring/perimeter/environment revision, stronger cyan player, current/max HP label, target-adjacent receipt, bottom-corner HUD hierarchy, and forced HUD synchronization.

Independent controls: [browser-ui-qa.mjs](../tests/browser-ui-qa.mjs) passed **11 checks** through actual keyboard, pointer, settings, fullscreen, and touch actions, with no page/console errors, failed resource responses, or external runtime requests in that run. Headless native tab-focus loss was not observable; its blur-handler check is explicitly identified as a synthetic blur event, not a native-focus pass. The visual contributor’s short native Chrome tab-switch retest still showed active play rather than a pause overlay under this instrumentation; native focus loss remains unverified. Source visibility/blur handlers and the frame watchdog are present; ordinary Escape pause is verified. See [QA_NOTES.md](QA_NOTES.md).

The portrait capture exposed two rendering issues that were not revealed by numerical assertions: a vertically stretched receipt and fog hiding the distant camera's arena. The receipt height is now bounded and has a regression check. The final actual [touch-portrait.png](evidence/touch-portrait.png), **390 × 844**, was opened after adaptive fog and receipt docking were applied: floor/player/skitter are visible, the `25% × 18 = 4.5` receipt is 74 px high at the upper-left, and it no longer covers the live target. Exact remaining HP is `27/2`, with no console/page errors. See [QA_NOTES.md](QA_NOTES.md) for the scope.

Domain verification is separate from image comparison: **27 exact math/state tests**, all five allocation witnesses, invalid/dead hits, boost timing, overkill, retry, pause, ellipse bounds, arc geometry, and historical event-resource snapshots. The final trace-only snapshot correction retains the prior gameplay/visual checks; its added nested-ammunition regression was independently run. See [CURRICULUM.md](../CURRICULUM.md), [QA_NOTES.md](QA_NOTES.md), and the lead's [PLAYTEST.md](../PLAYTEST.md) for current final counts and complete-flow evidence.

## Remaining limits

The build preserves the reference's arena view, action vocabulary, numerical state, color roles, and HUD hierarchy, with the asset/lighting/feedback approximations listed above. It is a playable browser slice, not a pixel-identical image reconstruction. The survival cycles include substantial dodge-only time after targets are cleared; automation verifies completion and consequences but does not establish that pacing is enjoyable. No student learning gains, human enjoyment, formal novelty acceptance, or Workbook endorsement is inferred from screenshots or automated play.
