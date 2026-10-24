# Asset provenance

## Pulse sentinel — generated and imported

- Created by this game's dedicated visual contributor through the user's existing Chrome Tripo session, in a new **⚡ Percent Pulse art** tab. No provider API or token was used.
- Task ID: `7b752222-eb1d-420c-9a7f-7c9c7275746d`
- Task page: https://studio.tripo3d.ai/workspace/generate/7b752222-eb1d-420c-9a7f-7c9c7275746d
- Generation date: 24 October 2026.
- Normal generation: H3.1 – Best Quality, Geometry & Texture, no parts or 8K add-on.
- Displayed submit cost: **45 credits**. One normal generation submitted. Global account balance is not attributed spend.
- Import target: `public/models/pulse-sentinel.glb`, visible on anchor enemies; mathematical/collision surfaces remain procedural and state-driven.

Exact prompt:

> A single original neon arena sentinel for a bold cel-shaded top-down 3D action game. Compact hovering angular armored combat drone, strong diamond silhouette, charcoal black ceramic body, vivid magenta enamel armor plates, one bright pale pink triangular central eye, two swept wing-like shoulder blades, no human face, no hands, no legs, no wheels, no pedestal, no background, no text. Hard-edged low-poly faceted surfaces, clean thick shapes and clear readable silhouette from above, symmetrical design, premium stylized game art, physically coherent single connected object. Front points toward camera, full isolated object.

Normal UI export: Export → GLB → 1K textures → file name `percent-pulse-sentinel`. The ordinary download completed in Chrome. The original is not bundled because its geometry is unnecessarily dense.

| Property | Normal export | Runtime model |
| --- | ---: | ---: |
| Size | 30,171,256 bytes | 2,367,328 bytes |
| Triangles | 953,215 | 35,988 |
| Vertices | 567,716 | 49,550 |
| SHA-256 | `51e3ce0601fcedc46f13a60b2c740db39bd71b00906d56ade5fbe508b6f5c549` | `c204f662f5493683fe81cca2515a20483ff49e6c08a7f4f40418353d4b8a2131` |

Processing used glTF Transform CLI 4.5.1 and the already installed Blender 5.2.0 LTS:

```sh
npx --yes @gltf-transform/cli weld percent-pulse-sentinel.glb sentinel-welded.glb
npx --yes @gltf-transform/cli simplify sentinel-welded.glb sentinel-simplified.glb --ratio 0.03 --error 0.1 --lock-border false
```

The simplifier stopped at 89,992 triangles because of UV boundaries. Blender then imported the simplified GLB, applied a Decimate modifier with ratio `0.4`, and exported an ordinary GLB with `export_apply=True`, `export_image_format="AUTO"`. Intermediate files were removed. No compression extension, decoder, skin, armature, or animation is required. The three normal/base-color/metallic-roughness textures remain local at 1K; the exported source had under 600 KB of compressed texture data.

The scene pitches the originally vertical face skyward, normalizes the longest dimension to 2.25 world units, and places it above the procedural anchor ring. Anchor collider radius remains exactly 1.25 in gameplay state. The generated bounds never control damage, hit tests, telegraph widths, or targeting. Mesh loading reports its actual outcome in `render_game_to_text`; the generated model replaces the anchor placeholder when loaded.

License evidence: the Chrome account selector visibly showed **Pro** at generation/export time. The [official Tripo commercial-use guide](https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially) describes paid-user use, modification, and distribution rights; the [authoritative terms](https://www.tripo3d.ai/terms) govern the asset. The generation used the displayed **Sharing Only** setting. This repository does not claim the output is public domain or independently relicense third-party service terms. No other artist's character or reference artwork was supplied.

No signed URLs, credentials, personal account details, or browser state are bundled.

## Procedural art

Arena, five-sided cyan player, fast triangular skitter enemies, rings, hazard surfaces, beams, reticle, and HP labels are original Three.js geometry authored for this game. Arena bounds and telegraph measurements use gameplay state, never generated mesh bounds. No rig is claimed; generated enemies float and rotate as whole objects.

## Art direction

Visual thesis: charcoal ceramic and bold faceted neon armor in a sparse combat amphitheatre. Cyan identifies the player and Bolt, magenta identifies hostile geometry, and warm pale highlights identify active danger. Shapes and distinct motion reinforce color cues.

Content plan: one full-canvas playable arena; HUD stays with the gameplay owner. The action plane is quiet and the arena trim provides orientation. Interaction motion: directional facing, bounded shallow camera follow, enemy hover and telegraph charging. Reduced effects removes hover and smooth camera motion.
