# Cosmos Graph Vision Features

A collection of advanced visualization features for the graph renderer. Each is designed to be tackled independently - create a worktree, give it a crack, merge if it works.

---

## 1. Level-of-Detail (LOD) Blending - "Reverse Raindrops"

**The Vision**: When zoomed out, individual nodes lose coherence and blend into a continuous field (heat map, density cloud). As you zoom in, nodes "condense" back into discrete particles - like watching raindrops form in reverse.

**Technical Approach**:
- Add a `lodBlendFactor` uniform driven by zoom level (`transformationMatrix[0][0]`)
- In the point fragment shader, interpolate between:
  - `lodBlendFactor = 0`: Normal particle rendering (crisp nodes)
  - `lodBlendFactor = 1`: Expanded, soft, overlapping gaussians that merge into fields
- The transition happens smoothly as you zoom

**Key Uniforms**:
```glsl
uniform float lodBlendFactor;  // 0.0 = particles, 1.0 = field
uniform float lodTransitionStart;  // Zoom level where transition begins
uniform float lodTransitionEnd;    // Zoom level where transition completes
```

**Difficulty**: Medium - mostly shader work, no architectural changes

---

## 2. Semantic Heat Maps

**The Vision**: Instead of coloring nodes by type, color them by meaningful metrics:
- **Error density**: Red = many errors, green = clean
- **Complexity/churn**: Hot colors = frequently changed, complex code
- **Connectivity**: Bright = hub nodes, dim = leaf nodes
- **Staleness**: Dim = old/untouched, bright = recently modified

**Technical Approach**:
- Add per-node metric attributes alongside colors (or encode in unused color channels)
- Add a `colorMode` uniform to switch between:
  - Type-based coloring (current)
  - Error heat map
  - Connectivity heat map
  - Custom metric
- Indexer computes metrics, sends as additional Float32Array

**Key Data**:
```typescript
interface NodeMetrics {
  errorCount: number;
  warningCount: number;
  complexity: number;      // Cyclomatic or similar
  lastModified: number;    // Timestamp
  connectivity: number;    // Degree centrality
  churn: number;           // Git commit frequency
}
```

**Difficulty**: Easy-Medium - data pipeline work, simple shader changes

---

## 3. Voronoi Territory Visualization

**The Vision**: Show which "territory" each hub node owns - the Voronoi cell around major nodes creates natural boundaries showing spheres of influence.

**Technical Approach**:
- Identify hub nodes (top N by connectivity)
- Compute Voronoi tessellation for hub positions
- Render Voronoi edges/cells as a background layer
- Color cells by the hub's type/color

**Options**:
1. **CPU + Canvas2D overlay**: D3's Voronoi is fast for <1000 points, render to a canvas behind WebGL
2. **GPU Voronoi**: Jump flooding algorithm in a fragment shader - more complex but scales
3. **Approximate**: Only compute for visible region, update on pan/zoom

**Use Cases**:
- "Which service does this code belong to?"
- "What's the nearest architectural boundary?"
- Cluster visualization without explicit clustering

**Difficulty**: Medium-Hard depending on approach

---

## 4. Delaunay Triangulation Overlay

**The Vision**: Show the "mesh" of nearest-neighbor relationships. Delaunay triangulation connects each node to its natural neighbors, revealing clustering structure.

**Technical Approach**:
- Compute Delaunay triangulation (dual of Voronoi)
- Render triangle edges as subtle lines
- Can filter to only show edges below a certain length (reveals clusters)
- Animate: edges could pulse based on some metric

**Use Cases**:
- Visualizing implicit dependencies (files that "should" be connected)
- Finding orphaned code (nodes with very long Delaunay edges)
- Showing natural module boundaries

**Difficulty**: Medium - same computation as Voronoi, different rendering

---

## 5. Metric-Driven Density Fields (Advanced Contours)

**The Vision**: Instead of "draw a contour around these nodes," draw contours where a metric field exceeds a threshold. The field is pre-computed into a texture, so there's no node count limit.

**Technical Approach**:
- Render node metrics to an offscreen texture (like a density splat)
- Each node contributes a gaussian blob to the texture, weighted by its metric value
- Contour shader samples this texture instead of iterating nodes
- Threshold levels create the topographic effect

**Example**: Error density field
- Each node with errors contributes a red blob proportional to error count
- Result: "hot spots" glow red where errors cluster
- No MAX_NODES limit - it's just texture sampling

**Difficulty**: Medium - requires render-to-texture pipeline, but removes node limits

---

## 6. Dual-Renderer LOD System

**The Vision**: Zoomed out = WebGL particles. Zoomed in on a single file = Rich DOM UI showing "4 errors, 3 warnings", file preview, actions.

**Technical Approach**:
- Define "detail threshold" - below this zoom level, nodes are particles
- Above threshold, visible nodes get DOM overlays positioned via CSS transforms
- Hybrid system: WebGL renders everything, DOM overlays appear on top for nearby nodes

**Key Components**:
```typescript
interface NodeDetailOverlay {
  nodeId: string;
  screenPosition: [number, number];  // Updated each frame from WebGL
  content: ReactNode;                 // Rich UI content
  visible: boolean;                   // Based on zoom + viewport
}
```

**Challenges**:
- Syncing DOM positions with WebGL coordinates
- Performance with many overlays (virtualization)
- Smooth transitions between particle and overlay

**Difficulty**: Hard - two rendering systems that need to stay in sync

---

## 7. Streaming Level-of-Detail Data

**The Vision**: Only load full detail (symbols, diagnostics) when zoomed into a file. Global view = files as dots. Zoomed in = full symbol tree.

**Technical Approach**:
- Backend serves data at multiple resolutions
- Initial load: Just files/directories with basic metrics
- On zoom/selection: Fetch symbols, diagnostics, relationships for visible region
- Progressive enhancement as you drill down

**API Design**:
```
GET /graph/overview        -> Files, directories, basic edges
GET /graph/detail/:fileId  -> All symbols, internal edges, diagnostics
GET /graph/region?bounds=  -> Everything in viewport at current zoom
```

**Difficulty**: Medium - backend architecture, not rendering

---

## Implementation Strategy

Each of these can be tackled independently:

1. **Create a worktree** for the feature
2. **Prototype in isolation** - get it working, don't worry about perfection
3. **Merge if it works** - iterate from there
4. **Abandon if stuck** - no shame, try a different approach

Recommended order (easiest wins first):
1. Semantic Heat Maps (just data + color mapping)
2. LOD Blending (shader work, high impact)
3. Metric-Driven Density Fields (solves MAX_NODES, enables heat maps)
4. Voronoi/Delaunay (visual wow factor)
5. Dual-Renderer LOD (hardest, most practical utility)
6. Streaming LOD (backend work, orthogonal to rendering)

---

## Notes

- The current graph already handles 15,000+ nodes with 47,000+ edges smoothly
- Flow animation is working and looks incredible
- Per-type settings, curved edges, Mission Control UI all functional
- Foundation is solid - these features are enhancements, not rewrites

*"This is the most fuckable graph I've ever seen"* - Tom, 2024
