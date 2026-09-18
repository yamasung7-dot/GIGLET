# GIGLET

GIGLET is a Blockbench lighting project built from the useful lighting foundation of the original **Blockbench Light Plug**, then simplified around native Blockbench objects.

## 5.0.0 — Light Plug Foundation

This release deliberately reuses the proven lighting ideas from the older Light Plug instead of rebuilding the lighting layer from zero.

Current feature:
- creates a regular Three.js point light in Blockbench's existing viewport scene;
- creates a native **GIGLET Light** Locator in the Outliner;
- lets Blockbench's normal transform controls move the light;
- displays a camera-facing billboard attached to the light object;
- uses billboard size as the light-size control;
- derives light power from billboard area;
- uses the model's current visible bounds to keep light range practical;
- provides preset colors and a custom color picker;
- cleans up the viewport light when the GIGLET Light object is removed.

### Use

**Tools → GIGLET Lighting → Create Light Billboard**

Then select **GIGLET Light** in the Outliner and move it normally.

The menu controls:
- Light Color
- Light Size
- Remove Light

Position is controlled by Blockbench itself.

## Raw plugin URL

```text
https://raw.githubusercontent.com/yamasung7-dot/GIGLET/main/plugins/giglet_render/giglet_render.js
```

## Foundation rule

GIGLET will build from Blockbench's native APIs and the old Light Plug's useful lighting code. We will add new capabilities only when they provide something beyond an existing Blockbench workflow.

## Testing

This release has been implemented and inspected at source level, but it has **not** been runtime-tested in Blockbench yet.
