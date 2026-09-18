# GIGLET

GIGLET is a Blockbench renderer focused on useful, practical lighting first.

## 2.0.0 — Regular Lighting

The ray-tracing experiment was removed after it proved too heavy and unreliable for the intended workflow.

The current renderer:
- uses Blockbench's existing Three.js ecosystem;
- renders the model in an isolated scene;
- uses normal real-time Three.js lighting and shadows;
- has a main point light represented by a camera-facing billboard;
- uses billboard size as the light's size control;
- derives light power from billboard area, so larger billboards produce stronger lights;
- provides light position controls;
- keeps the renderer separate from Blockbench's normal viewport.

Raw plugin URL:

https://raw.githubusercontent.com/yamasung7-dot/GIGLET/main/plugins/giglet_render/giglet_render.js

This is source-level work and still needs runtime testing in Blockbench.
