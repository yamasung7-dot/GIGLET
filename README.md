# GIGLET
Just a littile something⚡️

## Animation Relay 1.0.0

GIGLET's first concrete Blockbench feature is **Animation Relay**.

It captures a selected Blockbench bone/group animation, lets you switch to another model, and applies the animation when the target uses the same bone/group names.

### Plugin file

`plugins/animation_relay/animation_relay.js`

### Install directly from GitHub

Raw plugin URL:

https://raw.githubusercontent.com/yamasung7-dot/GIGLET/main/plugins/animation_relay/animation_relay.js

### Workflow

```
Source model
   ↓
Select animation
   ↓
Tools → Animation Relay: Capture Selected
   ↓
Switch model
   ↓
Tools → Animation Relay: Apply Saved
   ↓
New animation on target
```

### Development rule

GIGLET is intentionally built feature-by-feature:

1. Identify a real Blockbench problem.
2. Check the native Blockbench API.
3. Build the smallest useful solution.
4. Test it in Blockbench.
5. Fix what actually breaks.
6. Only then add the next feature.

No giant framework. No speculative architecture.
