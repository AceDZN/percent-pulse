# Percent Pulse · דופק האחוז

A playable Hebrew 3D arena shooter built with TypeScript, Three.js and Vite. Move, aim, dash and spend finite flat-damage or current-HP percentage attacks. Five encounters share an active arena: clear the threats **and survive the containment cycle**. The complete clean run is about 5½ minutes including interludes. No answer field or quiz gate.

## Run locally

Node.js 22+ recommended. All runtime models, textures and fonts are local; no backend, account, API key or network service is required to play.

```sh
npm ci
npm run dev       # http://localhost:5182 — strict port
npm test          # exact math and pure state tests
npm run build     # TypeScript check + static dist/
npm run preview   # http://localhost:4182 — strict port
```

Do not stop another process if a port is occupied. The verified production preview is served on4182. `dist/` is generated and ignored.

## Controls

| Action | Desktop | Touch/tablet |
| --- | --- | --- |
| Move | WASD or arrows | Left virtual stick |
| Aim | Mouse | Drag on arena |
| Bolt:18HP | Left click (hold), J or HUD control | ◆ button |
| Pulse:25% currentHP | Right click (hold), Q or HUD control | ◎ button |
| Dash / brief invulnerability | Space | Dash button |
| Arm next-hit +50% boost in encounter4 | E or boost control | Boost control |
| Pause / retry / optional explanation | Escape / pause button | Pause button |
| Fullscreen | F; Escape exits | Browser fullscreen when available |

Settings provide keyboard remapping, volume/mute, reduced effects, preview toggle and visible touch controls. Blur/visibility handlers and a frame watchdog pause combat and clear held input; native tab switching under debugger instrumentation remains unverified (see PLAYTEST.md). Opening settings freezes the simulation, including interludes.

## Implemented rules

- Bolt removes18HP. Pulse removes exactly one quarter of HP **at confirmed impact**. BigInt rational state is never rounded between hits.
- The optional one-hit boost multiplies raw damage by1.5: Bolt27, Pulse37.5% of captured currentHP. It expires only on a confirmed impact.
- Applied damage is capped at the remainingHP. Misses/dead rays spend cooldown, but consume neither ammunition nor boost.
- Percent-only strikes below100% cannot finish positive exactHP. Spending all Bolts while enemies survive produces an explicit recoverable failure.
- Pausing, immediate retry, truthful attempt-scoped hit replay, local anonymous action log, changed final values and an initially unhinted transfer encounter are implemented.
- Deterministic `window.advanceTime(ms)` advances all simulation in fixed1/60s steps and respects pause/settings. `window.render_game_to_text()` reports coordinates, exact HP, screen aim positions, hazards, resources and recent action effects.

## Art and evidence

The [generated design target](docs/visual-targets/gameplay-v1.png) is an imagegen mockup, **not a gameplay capture**. Its prompts and provenance are alongside it. The actual 3D scene is interactive geometry with a locally bundled, Chrome-Tripo-generated sentinel. [ASSETS.md](ASSETS.md) records task,45-credit displayed cost, exact prompt, normal GLB export, hashes, optimization and service license evidence. Heebo is bundled under its [OFL](docs/licenses/Heebo-OFL.txt).

[CURRICULUM.md](CURRICULUM.md) maps game actions to the supplied Workbook snapshots. Workbook has not validated this fictional game. [PLAYTEST.md](PLAYTEST.md) and [visual review](docs/VISUAL_REVIEW.md) distinguish tested behavior, actual screenshots and remaining deviations. Automation does not establish student learning or enjoyment.

Supplementary adaptive Chrome production run (real keyboard/mouse input; no injected wins):

```sh
node tests/browser-playthrough.mjs
```

The installed develop-web-game action client is also used; commands and observations are in PLAYTEST.md. Test output is ignored, representative actual evidence lives in `docs/evidence/`.

## Later Vercel deployment

The build is a static Vite site with relative asset paths. Import this existing public repository, choose Vite, use `npm run build` and output`dist`. `vercel.json` records those settings. No environment variables are required. This kickoff does not deploy or select a Vercel destination.

## Scope and limitations

This slice ships two enemy families, one boost, one arena and five finite encounters. The generated sentinel is an optimized static combined mesh animated as a whole, without a rig. The hero, skitter, exact telegraphs and arena are procedural. The scene follows the target's palette, camera, silhouette and HUD direction; it is not a pixel-identical reproduction of the dense illustration. Difficulty/long survival intervals still need human playtesting. Steam novelty/research gates remain unassessed; no formal acceptance or learning gains are claimed.
