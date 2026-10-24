# Percent Pulse · דופק האחוז

A Hebrew 3D arcade arena game. **Move; the blaster aims and fires automatically. Space releases a percentage Pulse that pushes nearby enemies away.** Clear eight short waves, with immediate celebration and current-wave retries.

This v2 rebuild responds to the owner's feedback about confusing controls and boring flow. The [plan](docs/rebuild-v2/PLAN.md) and [three generated mockups](docs/rebuild-v2/mockups/PROMPTS.md) were committed before source changes. The original manual-aim, finite-ammo and fixed-survival design has been replaced.

## Play locally

All runtime models, textures and fonts are bundled. No backend, login, API key or remote service is needed.

```sh
npm ci
npm run dev       # http://localhost:5182 — strict port
npm test
npm run build     # TypeScript check + static dist/
npm run preview   # http://localhost:4182 — strict port
```

Do not stop another process if a port is occupied. The local production preview uses 4182.

| Action | Desktop | Touch/tablet |
| --- | --- | --- |
| Move | WASD/arrows, or click/hold on the floor | Left stick, or touch the floor |
| Pulse | Space or the large Pulse button | Large Pulse button |
| Pause | Escape / pause button | Pause button |
| Fullscreen | F; Escape exits | Browser support permitting |

Settings include remapping, volume/mute, reduced effects and visible touch controls. Opening settings pauses play. The first wave teaches movement; the next safely introduces Pulse.

## Rules

- Ordinary shots deal exactly 18HP, target automatically across the compact arena, and never run out.
- Pulse removes exactly one quarter of each nearby enemy's **current HP at impact**, interrupts its warning and shoves it away. Two charges refill each wave from wave two. No nearby enemy means no charge spent.
- BigInt rational state is never rounded between hits. `96 → 72 → 54` remains exact. Auto-fire can change the base before a later Pulse; the actual receipt names that base.
- All damage has a prior floor warning. Contact alone does not hurt. One hit removes one of five shields, with brief invulnerability afterward. Clearing a wave heals one shield.
- The last assigned kill ends a wave immediately. Clear screens wait safely for Next. Failure retries only the current wave with health and charges restored.

The helper API retains tested boost/percentage math examples, but no boost is part of the v2 player controls. The percentage effect supports a positioning/rescue action; learning gains or strategic depth are not claimed.

## Art and verification

[ASSETS.md](ASSETS.md) records the original Chrome-Tripo task, displayed 45-credit cost, normal GLB export, exact prompt, hashes and licensing evidence. This rebuild reuses that visible model without new generation spend. The cyan hero, skitters, arena and mathematical warning/range shapes are procedural. Heebo is locally bundled under its OFL.

[PLAYTEST.md](PLAYTEST.md) records current measured results and limitations. [Visual review](docs/rebuild-v2/VISUAL_REVIEW.md) compares actual captures with the generated mockups. [CURRICULUM.md](CURRICULUM.md) maps the percentage rules to reviewed Workbook source snapshots; Workbook has not validated the game.

```sh
node tests/rebuild-playthrough.mjs  # all eight waves, real movement + Space
node tests/rebuild-browser-qa.mjs   # controls, recovery, settings, actual touch
```

These scripts observe `window.render_game_to_text()` and advance the documented fixed-step clock with `window.advanceTime(ms)`. They do not inject HP, resources, formations or wins. Representative real screenshots live in `docs/rebuild-v2/actual/`. Older `browser-playthrough.mjs`, `browser-ui-qa.mjs`, `docs/evidence/` and v1 review documents are historical, not current test instructions.

## Deployment later

This is a static Vite build with relative asset paths and `vercel.json`: build command `npm run build`, output `dist`. No environment variables are required. No Vercel deployment has been made.

The current slice has one arena, two enemy families, eight finite formations and a static generated anchor mesh animated as a whole. Automated checks establish behavior, not enjoyment. Human feedback on the simpler flow and real-device touch remains the next design input.
