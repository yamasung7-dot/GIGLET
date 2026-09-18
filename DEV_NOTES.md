# GIGLET Development Notes

## 4.0.0 — Movable Light Billboard

### Purpose
Add a simple, practical regular light directly to Blockbench's existing viewport and make its position behave like a normal editable Blockbench object.

### Current code
- `plugins/giglet_render/giglet_render.js` is the single executable plugin file.
- The plugin adds a **Tools → GIGLET Lighting** menu.
- **Create Light Billboard** creates a normal Three.js `PointLight` in `Canvas.scene`.
- It also creates a native Blockbench `Locator` named **GIGLET Light**.
- The Locator is kept at the project root and acts as the light's editable world-space position controller.
- The user can select and move the Locator with Blockbench's normal transform controls.
- A Three.js `Sprite` billboard is attached to the Locator's Three.js mesh.
- Billboard size controls the light size and its power is derived from billboard area.
- The menu provides preset light colors and a custom color picker.
- The menu provides light-size and removal controls, but no position dialog.
- The light and billboard are marked `no_export` so they are viewport helpers rather than model geometry.
- A lightweight `render_frame` listener synchronizes the PointLight with the Locator's current world position and removes the viewport light if the user deletes the Locator.

### Deliberate non-responsibilities
1. This version does not create a separate render window.
2. This version does not implement ray tracing.
3. This version does not implement PBR materials.
4. This version does not implement a path tracer or custom renderer.
5. This version does not change model geometry.
6. This version does not claim physically accurate area-light shadows. The billboard is the visual size/control representation while the actual light is a regular point light.
7. This version does not replace Blockbench's native transform controls with a custom position UI.

### Testing status
Source-level implementation only. Load it in Blockbench and test the actual viewport behavior before calling it runtime-tested.
