# GIGLET Development Notes

## Animation Relay 1.0.0

### Purpose

Provide a small bridge for reusing Blockbench bone/group animations between models.

### Implementation

The plugin uses Blockbench's native animation objects:

- `Animation.selected` to identify the active animation.
- `Animation#getUndoCopy()` to obtain animation data.
- `new Animation(data)` to reconstruct an animation.
- Bone/group animator data is keyed by group name before import so Blockbench can resolve the target model's UUIDs.
- `Animation#add(true)` and the native undo system register the new animation.

The plugin adds three actions to Blockbench's Tools menu:

- Capture Selected
- Apply Saved
- Clear Saved

### Constraints

- The v1 transfer is name-based.
- Duplicate source bone names are rejected.
- Missing target bone names abort the import before changing the target model.
- Saved data is memory-only for v1.
- No custom renderer, geometry engine, or mobile optimization system is included.

### Non-responsibilities

Animation Relay does not:

- retarget differently named skeletons,
- infer bone relationships,
- deform meshes,
- replace Blockbench's animation editor,
- persist a library of animations,
- optimize Blockbench for mobile.

### Future candidates

Only add these after real testing shows they are useful:

- persistent animation library,
- explicit bone mapping,
- import/export of animation packages,
- safer handling for more animator types,
- animation mirroring or retargeting.
