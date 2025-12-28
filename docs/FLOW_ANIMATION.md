# Flow Animation Guide

Cosmograph's flow animation system creates animated directional pulses along edges to visualize data flow, traffic, relationships, and more. The system uses a dual-layer PWM (Pulse Width Modulation) approach that's highly configurable and performant.

## Quick Start

```typescript
const graph = new Graph(container, {
  linkFlow: true,           // Enable flow animation
  linkFlowSpeed: 0.3,       // How fast pulses travel
  linkFlowPulseWidth: 0.1,  // Width of each pulse (0.01 = particles, 0.5 = waves)
  linkFlowPulseCount: 3,    // Number of pulses per edge
});
```

## How It Works

Flow animation creates bright pulses that travel along edges from source to target node. The effect is achieved entirely in the fragment shader, making it highly performant even with thousands of edges.

### The PWM Concept

Think of it like pulse width modulation in electronics:
- **Narrow pulse width** (0.01-0.05): Creates particle-like dots traveling along edges
- **Medium pulse width** (0.1-0.3): Creates distinct pulses or "packets"
- **Wide pulse width** (0.5-0.8): Creates gradient-like waves

## Configuration Options

### Layer 1 (Primary Flow)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `linkFlow` | boolean | `false` | Enable/disable flow animation |
| `linkFlowSpeed` | number | `0.5` | Speed of pulse travel (0.01 = very slow, 2.0 = fast) |
| `linkFlowPulseWidth` | number | `0.15` | Width of pulses (0.005-0.8) |
| `linkFlowPulseCount` | number | `3` | Number of pulses per edge (1-8) |
| `linkFlowWaveShape` | number | `1.0` | Transition shape: 0=square, 0.5=triangle, 1.0=sine |
| `linkFlowBrightness` | number | `1.5` | How bright the peaks are (1.0 = same as edge, 3.0 = bright) |
| `linkFlowFade` | number | `0.5` | How much to fade non-pulse areas (0 = no fade, 1 = invisible) |
| `linkFlowColor` | [r,g,b,a] | `[1,1,1,0]` | Pulse tint color (alpha controls blend amount) |

### Layer 2 (Secondary Effects)

Layer 2 stacks on top of Layer 1, allowing combinations like slow waves with fast sparks.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `linkFlow2` | boolean | `false` | Enable/disable second layer |
| `linkFlow2Speed` | number | `1.0` | Speed of layer 2 pulses |
| `linkFlow2PulseWidth` | number | `0.05` | Width of layer 2 pulses |
| `linkFlow2PulseCount` | number | `5` | Number of layer 2 pulses per edge |
| `linkFlow2WaveShape` | number | `0.5` | Transition shape for layer 2 |
| `linkFlow2Brightness` | number | `2.0` | Brightness of layer 2 peaks |
| `linkFlow2Fade` | number | `0.0` | Fade for layer 2 non-pulse areas |
| `linkFlow2Color` | [r,g,b,a] | `[1,1,0,0.8]` | Layer 2 pulse tint (yellow by default) |

## Wave Shapes

The `linkFlowWaveShape` parameter controls how pulses transition on/off:

- **Square (0.0)**: Sharp on/off transitions, like digital signals
- **Triangle (0.5)**: Linear ramp up and down, even gradient
- **Sine (1.0)**: Soft feathered edges with pronounced peak, most organic look

## Example Configurations

### Particles
Small bright dots traveling along edges:
```typescript
{
  linkFlow: true,
  linkFlowSpeed: 0.2,
  linkFlowPulseWidth: 0.015,
  linkFlowPulseCount: 5,
  linkFlowWaveShape: 1.0,
  linkFlowBrightness: 2.5,
  linkFlowFade: 0.6,
}
```

### Slow Waves
Gradient-like waves moving slowly:
```typescript
{
  linkFlow: true,
  linkFlowSpeed: 0.08,
  linkFlowPulseWidth: 0.5,
  linkFlowPulseCount: 1,
  linkFlowWaveShape: 1.0,
  linkFlowBrightness: 1.5,
  linkFlowFade: 0.2,
}
```

### Data Stream (Colored)
Cyan-tinted packets:
```typescript
{
  linkFlow: true,
  linkFlowSpeed: 0.3,
  linkFlowPulseWidth: 0.1,
  linkFlowPulseCount: 3,
  linkFlowWaveShape: 0.5,
  linkFlowBrightness: 2.0,
  linkFlowFade: 0.4,
  linkFlowColor: [0, 1, 0.8, 0.7],
}
```

### Warning Pulses
Sharp red warning indicators:
```typescript
{
  linkFlow: true,
  linkFlowSpeed: 0.5,
  linkFlowPulseWidth: 0.15,
  linkFlowPulseCount: 2,
  linkFlowWaveShape: 0.0,  // Square for sharp edges
  linkFlowBrightness: 3.0,
  linkFlowFade: 0.5,
  linkFlowColor: [1, 0.2, 0.1, 0.9],
}
```

### Dual Layer: Slow Waves + Fast Sparks
The power of two layers - background flow with highlight sparks:
```typescript
{
  // Layer 1: Slow red background pulse
  linkFlow: true,
  linkFlowSpeed: 0.1,
  linkFlowPulseWidth: 0.4,
  linkFlowPulseCount: 1,
  linkFlowWaveShape: 1.0,
  linkFlowBrightness: 1.3,
  linkFlowFade: 0.2,
  linkFlowColor: [1, 0.3, 0.3, 0.5],

  // Layer 2: Fast yellow sparks on top
  linkFlow2: true,
  linkFlow2Speed: 0.8,
  linkFlow2PulseWidth: 0.02,
  linkFlow2PulseCount: 4,
  linkFlow2WaveShape: 0.5,
  linkFlow2Brightness: 3.5,
  linkFlow2Fade: 0.0,
  linkFlow2Color: [1, 1, 0.3, 0.95],
}
```

## Runtime Updates

All flow parameters can be changed at runtime via `setConfig()`:

```typescript
// Speed up the flow
graph.setConfig({ linkFlowSpeed: 1.0 });

// Change to warning mode
graph.setConfig({
  linkFlowColor: [1, 0, 0, 0.9],
  linkFlowWaveShape: 0.0,
});

// Enable second layer
graph.setConfig({ linkFlow2: true });
```

## Performance Notes

- Flow animation runs entirely in the fragment shader - no CPU overhead per frame
- Performance is independent of edge count (same shader runs for all edges)
- Layer 2 adds minimal overhead (one additional PWM calculation per fragment)
- Disable flow when not needed for maximum performance: `linkFlow: false`

## Use Cases

- **Network traffic visualization**: Speed/width indicates bandwidth
- **Data pipelines**: Show data flowing between processing nodes
- **Social networks**: Visualize information spread
- **Dependency graphs**: Show build/compile order
- **Financial flows**: Money movement between entities
- **Biological networks**: Signal propagation in neural/metabolic networks

---

## Future Ideas

### Bidirectional Flow
Per-edge direction flag allowing edges to flow in either direction, or both simultaneously with different colors.

### Event Ripples
Emit pulses from a node that propagate outward along all connected edges when triggered by user interaction or data events.

### Flow Speed as Data
Map edge weight/value to flow speed dynamically. Thick pipes = fast flow, thin pipes = slow trickle.

### Temporal Sync Patterns
Synchronize pulse phases across clusters so different parts of the graph "breathe" together.

### Collision Effects
Visual feedback when pulses from multiple edges arrive at a node simultaneously.

### Gradient Along Edge
Static color gradient from source to target color (no animation) for simple direction indication.

### Audio-Reactive Flow
Drive flow parameters from audio input for music visualization through graph topology.

### Path Highlighting
Animate shortest path between two selected nodes with special pulse effects.
