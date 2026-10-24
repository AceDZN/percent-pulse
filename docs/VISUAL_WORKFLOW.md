# Gameplay-image implementation workflow

Latest human instruction, 24 October 2026: generate gameplay images with the imagegen skill, derive Chrome/Tripo models, build the real 3D game, and review the implementation against the planned screenshots. This supplements the distinct game handoff and exact public-repo/main/Chrome-Tripo requirements.

1. Inspect `docs/visual-targets/gameplay-v1.png` and its exact prompt in `docs/visual-targets/PROMPT.md`. It is a **generated gameplay design target**, not evidence of an implemented or tested game.
2. Record the camera/framing, world scale, core action, UI hierarchy, HUD state, palette/materials, silhouettes, feedback and interaction consequences in GAME_IDENTITY.md. Keep the five genres distinct and math authoritative; report any generated-image inconsistency instead of copying it.
3. Derive an explicit asset list. Generate required game-specific models through the user's Chrome Tripo session, matching the reference silhouette/material language. Reuse compatible already-submitted assets. Preserve exact mathematical geometry/colliders as authored code. Respect the existing two-generation initial allowance; no purchase or provider API.
4. Build actual 3D interactions. The reference bitmap must never stand in for the playable scene or be passed off as a real screenshot. All HUD controls shown as interactive must work.
5. Capture the production game at a comparable viewport, camera and game state through real inputs. Store actual captures separately from generated references. Capture a second action/consequence or failure/recovery state; a supplemental imagegen mockup can guide it.
6. Create `docs/VISUAL_REVIEW.md` with target/actual paths, viewport, camera, action/math state, and a table of scene/camera, silhouettes, HUD hierarchy, typography/RTL, inputs, feedback, depth/lighting and gameplay differences. Independent QA inspects both images plus actual play. Fix material differences, recapture and record unresolved deviations honestly. Static matching does not establish functional parity or fun.
7. Commit references, prompts, provenance, review and tested implementation regularly to the verified public main branch. Crew lead alone owns Git/index integration. Root supplies the primary image and does not commit over the crew's code.

Skill: /Users/acedzn/.codex/skills/.system/imagegen/SKILL.md. Built-in image_gen is the default and needs no API key; do not silently switch to CLI/API fallback. The root primary keyframe is generated centrally to avoid competing targets; a crew may generate one supplemental interaction state after inspecting it.

No further kickoff approval is required. Existing Steam research gates stay pending; they are separate from these directly authorized games. Deployment remains a later user step.

