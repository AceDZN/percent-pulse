# Verification and play evidence

24 October 2026. Crew: lead gameplay/integration/Git; dedicated visual/Chrome-Tripo contributor; independent math/playability reviewer. These are engineering observations, not evidence of enjoyment, student learning or novelty acceptance.

## Rules and state

`npm test`: **26/26 pass**. Independent tests cover exact96→72→54;72HP unboosted crossover; mixed100→57 vs61.5; commuting pure factors/opposite percentages; boost raw/applied/consumption; fractions and overkill;160 positive percent-only strikes; invalid/dead targets; serialized impacts; all five finite-ammo allocations; wrong-order63/8 remainder and recovery; pause; no-input failure; changed final values/no automatic help; movement/dash; exact ellipse bounds; arc radial/angular/wraparound geometry; and retry-scoped receipt logs.

`npm run build`: passes TypeScript and static Vite production build. Relative base, no backend/environment variables, bundled model/fonts/textures. The main JS chunk is approximately655kB (174kB gzip); Vite reports its normal500kB chunk warning. Runtime GLB is2,367,328bytes,35,988triangles. The entire generated output is approximately3.8MiB on disk. No source credentials, browser state or signed asset URLs are included.

## Actual full production play

`node tests/browser-playthrough.mjs` uses installed Google Chrome155.0.8059.85, headless,1672×941DPR1, against **http://localhost:4182**. It observes the public text hook, moves with actual keyboard events, aims/clicks with actual mouse events, arms the boost with E, dashes with Space, and uses only the documented fixed-step time hook. It never changes HP, ammo, encounters or a win state directly.

The final major-scene run completed all five encounters: **296.08s active combat +32s interludes ≈5:28**,29 confirmed hits/29 trigger attempts,9 enemies destroyed,46 dashes, zero retries, zero help openings. Final HP60; final ammo0/0. Encounter5 began with120+36HP,6Bolts/2Pulses and expected-damage preview off. All console/page-error, failed-request, HTTP-error-response and external-runtime-request lists were empty. The same script separately reached failure through no-input play, clicked Retry, checked restored resources, paused/resumed, retried, and resized without changing mathematical state.

Representative actual captures:

- `docs/evidence/pulse-72.png`: same1672×941as generated target; first Pulse, anchor72/96, skitter18HP, player100HP, ammo4/1, actual receipt25%×96=24.
- `docs/evidence/pulse-54.png`: second Pulse uses72as its base, leaves54.
- `docs/evidence/boost-27.png`: armed boost produces18×1.5=27, expires,27HP skitter disappears.
- `docs/evidence/transfer.png`: changed final values with preview initially off.
- `docs/evidence/victory.png` and `failure.png`: actual completed run and no-input failure/retry UI.

Small final UI corrections after that complete run: qualify the crossover text as unboosted, replace the consumed-boost toast, and prevent portrait receipts stretching between inline top and mobile bottom. The independent UI recheck covers those layout/control paths; the mathematical/gameplay logic is unchanged except the truthful boost toast.

## Installed action client

The required installed client was run after meaningful combat/visual changes. Final lead command:

```sh
node /Users/acedzn/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js \
  --url http://localhost:4182 --click-selector '#start-btn' \
  --actions-json '{"steps":[{"buttons":["right"],"frames":24},{"buttons":["space"],"frames":10},{"buttons":[],"frames":80}]}' \
  --iterations 1 --pause-ms 250 --screenshot-dir playtest-output/final-client
```

Its5-second Start timeout was reported under host load, but the actual click took effect; inspected final screenshot/state is **playing**,2s simulation, x8.61,1dash, HP100, visible first sweep, model loaded; no errors artifact. Visual contributor's separate final production action run also passed an actual18→0Bolt hit/ammo2→1and dash with no errors. Earlier dev attempts hit HMR context loss while code changed; those were rerun on stable production and are not counted as passes.

## User's Chrome

The visual contributor owns its dedicated Chrome Tripo and game tabs. Through the user's actual Chrome UI on production4182 it started play, killed the18HP skitter using native left click, visibly dashed with native Space, observed idle-hazard failure and clicked immediate Retry, then repeated attack/dash. Arrow taps were sent but sustained movement was not quantified, so no separate manual movement claim is made. App-only Chrome error/warning search was empty. Actual Chrome JPEGs: `docs/evidence/chrome-manual-inputs.jpg`, `chrome-manual-failure.jpg`. All-five progression is the adaptive real-control Chrome run above.

## Independent review and limits

See `docs/QA_NOTES.md` for findings/fixes and final controls results, and `docs/VISUAL_REVIEW.md` for generated-target versus actual-image comparison. Headless tab switching may not emit native blur; the reviewer distinguishes explicit handler testing from native focus evidence. Some runs were slow while five crews shared this AppleM2Max/32GiB host; temporary Vite rebuild404s and model-wait timeouts were isolated from stable-build results.

Performance measurement and arc-action evidence are recorded in `docs/evidence/frame-measurement.json` and `arc-telegraph.png`. Its context must be read before interpreting frame intervals. Human difficulty/playtesting remains needed, especially the length of dodge-only containment intervals and the simpler model silhouettes relative to the generated illustration. No Vercel deployment has been made; the static build and configuration are ready for the user's later destination choice.
