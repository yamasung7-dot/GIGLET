# GIGLET Development Notes

## 1.0.0 — Ray Core

### Purpose
Create a real offline/progressive renderer inside Blockbench without duplicating the normal Three.js viewport renderer.

### Current code
- `plugins/giglet_render/giglet_render.js`: complete executable plugin.
- The plugin registers a Tools menu action and opens a dedicated render dialog.
- Visible Blockbench Three.js meshes are converted to triangle data.
- A Web Worker performs BVH-style scene acceleration and progressive ray tracing.
- The renderer currently uses a simple diffuse material model and a directional light.
- Samples accumulate progressively so the image improves as rendering continues.
- Rendering can be cancelled without blocking the Blockbench UI thread.
- The result can be saved as PNG.

### Deliberate non-responsibilities
1. This version does not replace Blockbench's viewport renderer.
2. This version does not implement PBR textures.
3. This version does not implement glossy/specular reflection.
4. This version does not implement HDR environment maps.
5. This version does not claim GPU path tracing.
6. Mobile optimization is not a separate subsystem here; the worker only keeps the UI responsive.

### Next research targets
- verify runtime compatibility with current Blockbench;
- inspect current material/texture APIs;
- determine whether the Blockbench-bundled Three.js version can support a vendored WebGL2 BVH path tracer;
- benchmark mobile resolution/sample limits;
- add textured albedo only after the ray core is verified;
- later evaluate GPU path tracing using a BVH encoded for shader traversal.

### Testing status
Source-level implementation only. Do not describe this as runtime-tested until it has been loaded and exercised in Blockbench.
