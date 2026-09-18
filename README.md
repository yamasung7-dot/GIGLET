# GIGLET

GIGLET is a Blockbench lighting experiment focused on adding a practical regular light directly to the normal viewport.

## 3.0.0 — Billboard Lighting

The separate render window has been removed.

The current feature:
- creates a normal Three.js point light in Blockbench's existing viewport scene;
- represents that light with a camera-facing billboard;
- keeps the billboard attached to the light's position;
- uses billboard size as the light-size control;
- derives light power from billboard area, so a larger billboard produces more light;
- lets you change the light color from the GIGLET Lighting menu;
- includes preset colors plus a custom color picker;
- lets you change the light position and billboard size from the menu;
- can remove the light without changing model geometry.

### GIGLET Lighting menu

Use:

**Tools → GIGLET Lighting → Create Light Billboard**

Then use the same menu to change:
- Light Color
- Light Size
- Light Position
- Remove Light

The billboard is a Three.js Sprite, so it automatically faces the viewport camera.

## Raw plugin URL

https://raw.githubusercontent.com/yamasung7-dot/GIGLET/main/plugins/giglet_render/giglet_render.js

## Testing

This is source-level implementation work. It still needs to be loaded and exercised in the current Blockbench build before it can be considered runtime-tested.
