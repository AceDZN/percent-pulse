# Current v2 verification and play evidence

24 October 2026. This rebuild responds to the owner's report that v1 was confusing, awkward and boring. V1 automation did not establish usability or enjoyment. Current rules, controls and acceptance are in [the rebuild plan](docs/rebuild-v2/PLAN.md); old `docs/evidence/`, v1 reviews and browser harnesses are historical.

## Mockup before implementation

Three actual generated references—[opening](docs/rebuild-v2/mockups/opening.png), [Pulse combat](docs/rebuild-v2/mockups/combat.png) and [immediate clear](docs/rebuild-v2/mockups/clear.png)—were saved with exact prompts/hashes, inspected by the crew and pushed in commit `b5e6471` before the v2 source implementation. They are mockups, not gameplay captures. [The visual review](docs/rebuild-v2/VISUAL_REVIEW.md) compares them with the implemented real 3D scene.

## Rules, build and recovery

`npm test`: **33/33 pass** (21 current flow/state tests, 12 retained exact-math checks). The state suite covers movement-only onboarding, safe four-target Pulse, automatic unlimited fire, stable target/range, exact current-base area damage, shove/interrupt, no-target charge preservation, immediate final-kill clear, staged arrivals, warned damage/invulnerability, checkpoint retry, pause, bounded movement and immutable traces. Retained boost/finite-ammo arithmetic fixtures do not describe shipped v2 controls.

`npm run build` passes TypeScript and static Vite generation. Main JS is about 661kB / 176kB gzip; Vite reports its usual 500kB chunk warning. The visible existing Tripo GLB is 2,367,328 bytes / 35,988 triangles. Models, textures and licensed fonts are local. No backend, API key, remote runtime request or new Tripo generation spend is needed.

## Full eight-wave real-control run

`node tests/rebuild-playthrough.mjs` uses installed Google Chrome 155.0.8059.85 headless at 1672×941 DPR1, against production **http://localhost:4182/**. It sends actual movement keys and Space, observes the read-only text hook and uses the public fixed-step clock. It never injects enemies, HP, resources, waves or a win. Its adaptive route reads warnings precisely; this is a feasible engineering route, not a human difficulty estimate.

The final desktop run completed all eight waves at **114.85 game-clock seconds**, with **48 kills, 11 Pulses, zero retries, 100 final HP**. This clock includes the safe guided introductions, excludes clear screens, and is not wall-clock play duration. Wave combat clocks were 2.37, 4.25, 7.98, 14.02, 14.55, 19.00, 23.47 and 26.02 seconds. The last assigned kill immediately cleared each wave, removed all warnings and safely froze the game clock. No forced survival countdown remains. No page/console errors, failed responses or external runtime requests were observed. [Compact report](docs/rebuild-v2/actual/full-run-report.json).

Actual final-build captures:

- [Opening auto-fire](docs/rebuild-v2/actual/opening.png): a real ordinary shot, movement-only coach and no Pulse UI yet.
- [Safe Pulse introduction](docs/rebuild-v2/actual/pulse-intro.png): 96HP anchor and three 24HP skitters, all in range.
- [First Pulse](docs/rebuild-v2/actual/combat.png): exact 96→72, three 24→18 hits, one charge used and a visible expanding shockwave.
- [Immediate clear](docs/rebuild-v2/actual/clear.png), [later area Pulse](docs/rebuild-v2/actual/multi-pulse.png), [victory](docs/rebuild-v2/actual/victory.png).

The final narrow-camera adjustment changes only responsive framing below aspect 1.35; the desktop source/dimensions above remain unchanged.

## Independent controls and touch

[Independent QA](docs/REBUILD_QA.md) passed **13/13 Chrome action checks** plus **4/4 final UI follow-ups**. These verify actual keyboard and floor-click movement, one edge-triggered Space action, held-key guards, remapping/mute/reduced effects, focused-button Enter, pause/resize/fullscreen, actual CDP touch stick and Pulse taps, updated current-base receipts and genuine failure/recovery. Idle play cleared waves 3 and 4 and lost on wave 5; Retry preserved wave 5 and restored 100HP, two charges and empty attempt receipts. The explicit blur-handler check uses a synthetic event; native focus behavior is not claimed.

Touch instructions now name the on-screen stick and button. Final responsive framing adds enough margin for the player at the arena edge; the targeted eight directional-input/viewport observations are in [narrow-camera-report.json](docs/rebuild-v2/actual/narrow-camera-report.json). Actor/HP labels still become smaller on a narrow phone. Tablet and desktop remain the better view for inspecting numerical labels; no real-device phone usability claim is made.

## Installed action client

The required installed client was run after the final UI changes:

```sh
node /Users/acedzn/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js \
  --url http://localhost:4182 --click-selector '#start-btn' \
  --actions-json '{"steps":[{"buttons":["right"],"frames":15},{"buttons":[],"frames":65}]}' \
  --iterations 1 --pause-ms 250 --screenshot-dir playtest-output/v2-final-client
```

The actual screenshot was opened and inspected: ordinary shot visible, player moved, movement coach visible, 1/3 enemies destroyed and no errors artifact. Earlier opening testing exposed an avoidable range issue, where a visible enemy was outside ordinary fire range; automatic shots now cover the compact arena. Independent state and browser tests verify that correction.

## User's Chrome and rendering

The visual contributor used its owned user-Chrome game tab on fresh v2 without a time hook: Start, floor-click movement, automatic first clear, Next, and Space on the focused Pulse control. Actual [Pulse](docs/rebuild-v2/actual/user-chrome-pulse.jpg) and [clear](docs/rebuild-v2/actual/user-chrome-clear.jpg) captures are 1728×780. The first Pulse displayed 72/96 and three 18HP skitters; wave 2 later cleared at five shields. Body-level key targeting timed out, so the visible Pulse button was focused for Space. Native macOS input was unavailable while the Mac was locked. This verifies real browser input, not OS-native focus behavior. Observed logs had extension-origin messages and no game-origin errors.

The [new frame measurement](docs/rebuild-v2/actual/frame-measurement.json) samples 120 real requestAnimationFrame intervals during normal wall-clock wave-two gameplay, without freezing or advancing the clock. On this shared Apple M2 Max/32GiB host, installed headless Chrome/ANGLE Metal at 1672×941 DPR1: mean **16.80ms**, median **16.7ms**, p95 **16.7ms**, maximum **33.3ms**, with 156 draw calls / 42,820 triangles at the final sample. Game time advanced 2.37→4.40 while still playing wave 2. This is one desktop scene observation, not a mobile or broad performance benchmark.

## Remaining design input

The rebuilt flow removes simultaneous manual aiming, finite-ammunition dead ends and empty-arena waiting. Automation establishes that its rules/controls work; it cannot establish that the owner now finds it fun. The next useful input is the owner's uncoached first attempt: whether movement, automatic fire and the one Pulse action are immediately understood. Phone label size, the simplified procedural characters and occasional lower-hero overlap on clear screens remain visible limitations. The static production build is ready locally; no Vercel deployment has been made.
