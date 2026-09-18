# GIGLET Development Notes

## 3.0.0 — Billboard Lighting

### Purpose
Add a simple, practical regular light directly to Blockbench's existing viewport instead of opening a separate renderer window.

### Current code
- `plugins/giglet_render/giglet_render.js` is the single executable plugin file.
- The plugin adds a **Tools → GIGLET Lighting** menu.
- **Create Light Billboard** creates a normal Three.js `PointLight` in `Canvas.scene`.
- A Three.js `Sprite` is attached to the light position as the visible billboard.
- Billboard size controls the light size and its power is derived from billboard area.
- The menu provides preset light colors and a custom color picker.
- The menu also provides light-size, position, and removal controls.
- The light and billboard are marked `no_export` so they are viewport helpers rather than model geometry.

### Deliberate non-responsibilities
1. This version does not create a separate render window.
2. This version does not implement ray tracing.
3. This version does not implement PBR materials.
4. This version does not implement a path tracer or custom renderer.
5. This version does not change model geometry.
6. This version does not claim physically accurate area-light shadows. The billboard is the visual size/control representation while the actual light is a regular point light.

### Testing status
Source-level implementation only. Load it in Blockbench and test the actual viewport behavior before calling it runtime-tested.
