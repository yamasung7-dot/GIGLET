# GIGLET Development Notes

## 5.0.0 — Light Plug Foundation

### Why this release exists

The earlier GIGLET renderer was being rebuilt from scratch. That was unnecessary. The original **Blockbench Light Plug** already contained useful native Blockbench/Three.js lighting work.

For 5.0.0, the lighting foundation was taken from that project and adapted instead of reinventing the same layer.

### Current code

- `plugins/giglet_render/giglet_render.js` remains the single executable plugin file.
- The plugin registers as `giglet_render`.
- A native Blockbench `Locator` named **GIGLET Light** is the editable controller.
- The controller stays at the project root so its position is treated as world-space.
- A regular Three.js `PointLight` is attached to the normal `Canvas.scene`.
- A Three.js `Sprite` is attached to the Locator mesh as the visible camera-facing light billboard.
- Billboard size controls the visual light size and contributes to point-light power.
- Model bounds are read from visible meshes to establish a practical light range.
- The light and billboard use `no_export`/helper state so they are not intended to become model geometry.
- A lightweight `render_frame` listener keeps the Three.js light synchronized with the native Blockbench Locator.
- Deleting the Locator removes the associated viewport light.
- Lighting uses the regular Three.js point-light path rather than ray tracing.

### What was reused from the old Light Plug

The conceptual/native lighting pieces reused from the old project are:
- Three.js light creation inside `Canvas.scene`;
- model-bound calculation with `THREE.Box3`;
- size/range-aware light setup;
- normal Blockbench lifecycle cleanup;
- the idea of letting Blockbench remain responsible for the model/viewport while the plugin adds lighting.

The old Light Plug's large studio UI, PNG post-processing, and experimental shader/parallax system were **not** copied into this foundation.

### Deliberate non-responsibilities

1. No ray tracer.
2. No separate render window.
3. No custom geometry renderer.
4. No replacement PBR material system.
5. No custom position dialog.
6. No fake area-light physics; the visible billboard represents size while the actual light is a regular point light.
7. No mobile-optimization layer; MOP remains a separate project.

### Testing status

Source-level implementation only. The plugin must be loaded and exercised in the current Blockbench build before it is considered runtime-tested.
