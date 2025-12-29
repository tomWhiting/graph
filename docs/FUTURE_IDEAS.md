# Future Ideas for Cosmograph Extensions

## Fluid Flow Visualization (HIGH INTEREST)

**Concept**: Events/activity flowing through the graph like fluid through pipes.

**Technical approach**:
- Adapt Navier-Stokes fluid simulation techniques from WebGL-Fluid-Simulation
- Events as "splats" injected at nodes
- Velocity field following edge directions
- Advection carries color/intensity along edges
- Dissipation over time (or accumulation for heat maps)

**Use cases**:
- Claude Code events traveling through file dependency graph
- Activity heat building up in problem areas
- Real-time flow visualization of data through systems
- Hotspot detection (areas with accumulated activity)

**Reference**: https://github.com/PavelDoGreat/WebGL-Fluid-Simulation

**Key shaders to adapt**:
- `advectionShader` - moves dye with velocity field
- `splatShader` - injects color at points
- `divergenceShader` / `pressureShader` - fluid dynamics
- `bloomShader` - glow effects for hot areas

---

## Contour/Metaball Groupings (PRIORITY)

**Concept**: Organic blobby boundaries around node groups.

**Technical approach**:
- Sigma.js layer-webgl contours implementation
- Per-pixel distance summation from group nodes
- Threshold-based color bands (topographic style)
- Anti-aliased contour lines at boundaries

**Use cases**:
- Task boundaries showing which files belong to which Claude
- Subsystem visualization
- Cluster highlighting
- Dynamic group membership as work progresses

**Reference**: https://github.com/jacomyal/sigma.js/tree/main/packages/layer-webgl

---

## Notes

- Both features require WebGL2 for cleaner implementation
- Performance is paramount - these are overlay effects, not core simulation
- Should integrate as optional modules, not break existing functionality
