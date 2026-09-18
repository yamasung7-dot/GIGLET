# Animation Relay

Animation Relay is the first GIGLET plugin prototype.

## v1.0.0

It solves one small Blockbench workflow problem:

**Capture a bone/group animation on one model, switch to another model, then apply the saved animation to matching bone/group names.**

### How to use

1. Open a model containing an animation.
2. Enter Animate mode and select the animation.
3. Open **Tools → Animation Relay: Capture Selected**.
4. Switch/open the target model.
5. Make sure its bone/group names match the source.
6. Use **Tools → Animation Relay: Apply Saved**.
7. Blockbench creates a new imported animation on the target model.

The saved animation lives in memory for this plugin session. It is intentionally not persisted yet.

## v1 limitations

- Bone/group names must match, case-insensitively.
- Duplicate bone names are rejected during capture.
- No automatic retargeting or bone mapping yet.
- v1 focuses on Blockbench bone/group transform channels.
- The plugin does not modify the source animation.
