# GIGLET

GIGLET is a Blockbench lighting experiment focused on adding a practical regular light directly to the normal viewport.

## 4.0.0 — Movable Light Billboard

The light is now represented by a real **Blockbench Locator object** instead of being positioned through a menu.

The current feature:
- creates a normal Three.js point light in Blockbench's existing viewport scene;
- creates a movable **GIGLET Light** object in the Blockbench Outliner;
- uses that object as the light's position controller;
- lets you move the light with Blockbench's normal move controls, just like a model object;
- displays a camera-facing billboard on the light object;
- uses billboard size as the light-size control;
- derives light power from billboard area, so a larger billboard produces more light;
- lets you change the light color from the GIGLET Lighting menu;
- includes preset colors plus a custom color picker;
- lets you change billboard/light size from the menu;
- can remove the light without changing model geometry.

### GIGLET Lighting menu

Use:

**Tools → GIGLET Lighting → Create Light Billboard**

After creation, select **GIGLET Light** in the Outliner and move it normally with Blockbench's transform controls.

The menu is only used for:
- Light Color
- Light Size
- Remove Light

Position is no longer controlled by a dialog.

The visible light marker is a Three.js Sprite attached to the Blockbench light object, so it faces the viewport camera.

## Raw plugin URL

https://raw.githubusercontent.com/yamasung7-dot/GIGLET/main/plugins/giglet_render/giglet_render.js

## Testing

This is source-level implementation work. It still needs to be loaded and exercised in the current Blockbench build before it can be considered runtime-tested.
