# WebGL2 Upgrade Analysis for Cosmograph

## Executive Summary

**Bad news**: Regl (the WebGL wrapper Cosmograph uses) **deliberately does not support WebGL2**. The maintainers decided "WebGL 2.0 is not worth the trouble" since WebGL1 with extensions covers most use cases.

**Good news**: We have viable paths forward that don't require replacing Regl entirely.

---

## Current State

### Cosmograph's WebGL Setup
```typescript
// src/index.ts:105
reglInstance = regl({
  canvas: this.canvas,
  attributes: { antialias: false, preserveDrawingBuffer: true },
  extensions: ['OES_texture_float', 'ANGLE_instanced_arrays'],
})
```

### Shader Syntax (WebGL1 / GLSL ES 1.0)
- `#ifdef GL_ES` / `precision highp float;`
- `attribute` for vertex inputs
- `varying` for vertex→fragment communication
- `texture2D()` for texture sampling
- `gl_FragColor` for fragment output

### Sigma's Contours (WebGL2 / GLSL ES 3.0)
- `#version 300 es`
- `in` / `out` keywords
- `texelFetch()` for exact texel access
- Explicit `out vec4 fragColor;` declaration

---

## Why Sigma Uses WebGL2

The key WebGL2 feature Sigma's contours use is `texelFetch`:

```glsl
// WebGL2 - exact texel access by integer coordinates
vec2 nodePos = texelFetch(u_nodesTexture, ivec2(i, 0), 0).xy;
```

In WebGL1, we'd calculate normalized coordinates:
```glsl
// WebGL1 equivalent
vec2 nodePos = texture2D(u_nodesTexture, vec2((float(i) + 0.5) / float(nodeCount), 0.5)).xy;
```

With `gl.NEAREST` filtering (which Cosmograph already uses), this gives identical results.

---

## Options

### Option A: Port Contours Shader to WebGL1 (RECOMMENDED - Low Risk)

**What it means**: Rewrite Sigma's contour shader in WebGL1 GLSL syntax.

**Changes needed**:
1. Remove `#version 300 es`
2. `in` → `attribute` / `varying`
3. `out vec4 fragColor` → use `gl_FragColor`
4. `texelFetch()` → `texture2D()` with normalized coords

**Pros**:
- Zero changes to existing Cosmograph code
- Works in current Regl setup
- Broad browser compatibility
- No risk to existing functionality

**Cons**:
- Slightly more complex shader code
- No access to other WebGL2 features

**Risk**: LOW

---

### Option B: Hybrid Context (Medium Risk)

**What it means**: Pass a WebGL2 context to Regl, keep existing code, add new modules using raw WebGL2.

```typescript
// Create WebGL2 context manually
const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
const reglInstance = regl({ gl });

// Existing Regl code works (WebGL2 is backward compatible)
// New overlay modules can use raw gl.* calls with WebGL2 features
```

**Pros**:
- Access to WebGL2 features for new code
- Existing modules unchanged
- Progressive enhancement

**Cons**:
- Mixing Regl abstractions with raw WebGL calls
- Need to manage state carefully
- Some Regl internals may have issues

**Risk**: MEDIUM

---

### Option C: Full WebGL2 Migration (HIGH RISK - NOT RECOMMENDED)

**What it means**: Replace Regl with WebGL2-native code or different library.

**Would require**:
- Rewrite all 11 vertex shaders
- Rewrite all 22 fragment shaders
- Replace Regl abstraction layer (~1000s of lines)
- Extensive testing

**Risk**: VERY HIGH - Could break everything for minimal benefit

---

## Recommendation

**Start with Option A** (Port shader to WebGL1):
1. Implement contours as a new Cosmograph module
2. Use WebGL1 GLSL, works with existing Regl setup
3. Validate the feature works correctly

**Later, consider Option B** if we need more WebGL2 features:
1. Switch to WebGL2 context (backward compatible)
2. Add new WebGL2-only modules as needed
3. Keep existing modules on Regl

---

## Implementation Plan for Contours Module

### Phase 1: Basic Contours (WebGL1)
1. Create `src/modules/Contours/` directory
2. Port Sigma shader to GLSL ES 1.0
3. Integrate with existing render loop
4. Expose API: `graph.setGroups({ groupId: nodeIndices[] })`

### Phase 2: Enhanced Features
1. Multiple simultaneous groups
2. Animated group transitions
3. Level/threshold customization
4. Border styling

### Phase 3: (Future) WebGL2 Enhancements
1. Switch to WebGL2 context
2. Add fluid flow visualization
3. Advanced post-processing effects

---

## Key Files to Create

```
src/modules/Contours/
├── index.ts              # ContoursModule class
├── contour.vert          # Simple fullscreen quad
├── contour.frag          # Metaball distance field
├── types.ts              # GroupDefinition interfaces
└── README.md             # Documentation
```

---

## WebGL1 Contour Shader (Draft)

```glsl
// contour.frag - GLSL ES 1.0 compatible
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_groupNodesTexture;  // Node positions for this group
uniform float u_nodeCount;
uniform float u_radius;
uniform vec4 u_levelColors[4];
uniform float u_levelThresholds[4];
uniform int u_levelCount;
uniform mat3 u_invMatrix;
uniform vec2 u_screenSize;

varying vec2 textureCoords;

void main() {
    // Convert screen coords to world coords
    vec2 screenPos = textureCoords * 2.0 - 1.0;
    vec2 worldPos = (u_invMatrix * vec3(screenPos, 1.0)).xy;

    // Calculate metaball score
    float score = 0.0;
    for (int i = 0; i < 1000; i++) {  // Loop limit, actual count from uniform
        if (float(i) >= u_nodeCount) break;

        // Sample node position from texture
        float texCoord = (float(i) + 0.5) / u_nodeCount;
        vec2 nodePos = texture2D(u_groupNodesTexture, vec2(texCoord, 0.5)).xy;

        float d = distance(worldPos, nodePos);
        score += smoothstep(u_radius, 0.0, d);
    }

    // Pick color based on score thresholds
    vec4 color = vec4(0.0);
    for (int i = 0; i < 4; i++) {
        if (i >= u_levelCount) break;
        if (score > u_levelThresholds[i]) {
            color = u_levelColors[i];
        }
    }

    gl_FragColor = color;
}
```

---

## References

- [Regl WebGL2 Issue #561](https://github.com/regl-project/regl/issues/561)
- [Regl WebGL2 Investigation #378](https://github.com/regl-project/regl/issues/378)
- [Sigma.js layer-webgl](https://github.com/jacomyal/sigma.js/tree/main/packages/layer-webgl)
