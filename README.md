# GIGLET

GIGLET is the development repository for a Blockbench renderer focused on real progressive ray rendering rather than screenshots or web uploaders.

## 1.0.0 — Ray Core

The first implementation:
- extracts visible Blockbench mesh geometry;
- builds an acceleration structure in a Web Worker;
- traces rays progressively;
- supports direct lighting, shadows, multiple diffuse bounces, accumulation, and cancellation;
- renders into a dedicated canvas instead of replacing Blockbench's viewport;
- exports the finished image as PNG.

This is deliberately a small renderer core. Textured/PBR materials, environment lighting, glossy reflection, denoising, and GPU path tracing are future work rather than pretend features.

## Install

Raw plugin URL:

https://raw.githubusercontent.com/yamasung7-dot/GIGLET/main/plugins/giglet_render/giglet_render.js

## Important

1.0.0 is an initial ray core, not a finished Cycles replacement. Runtime testing in Blockbench is still required before calling this release production-ready.
