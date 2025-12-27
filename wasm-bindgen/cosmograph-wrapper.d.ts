/**
 * Cosmograph WASM-bindgen Wrapper Type Definitions
 *
 * These type definitions are designed for use with wasm-bindgen in Rust.
 * The actual JS module wraps @cosmos.gl/graph for WASM consumption.
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Partial configuration interface for graph initialization and updates.
 * This is a simplified version of GraphConfigInterface suitable for WASM.
 */
export interface WasmGraphConfig {
  // Rendering
  backgroundColor?: string | [number, number, number, number];
  pixelRatio?: number;
  renderLinks?: boolean;
  curvedLinks?: boolean;
  curvedLinkSegments?: number;
  scalePointsOnZoom?: boolean;
  scaleLinksOnZoom?: boolean;

  // Point styling
  pointDefaultColor?: string | [number, number, number, number];
  pointDefaultSize?: number;
  pointOpacity?: number;
  pointSizeScale?: number;
  pointGreyoutColor?: string | [number, number, number, number];
  pointGreyoutOpacity?: number;
  hoveredPointRingColor?: string | [number, number, number, number];
  hoveredPointCursor?: string;
  renderHoveredPointRing?: boolean;
  focusedPointRingColor?: string | [number, number, number, number];
  focusedPointIndex?: number;

  // Link styling
  linkDefaultColor?: string | [number, number, number, number];
  linkDefaultWidth?: number;
  linkOpacity?: number;
  linkWidthScale?: number;
  linkGreyoutOpacity?: number;
  linkDefaultArrows?: boolean;
  linkArrowsSizeScale?: number;
  hoveredLinkColor?: string | [number, number, number, number];
  hoveredLinkCursor?: string;
  hoveredLinkWidthIncrease?: number;
  linkVisibilityDistanceRange?: [number, number];
  linkVisibilityMinTransparency?: number;

  // Simulation
  enableSimulation?: boolean;
  simulationDecay?: number;
  simulationGravity?: number;
  simulationCenter?: number;
  simulationRepulsion?: number;
  simulationRepulsionTheta?: number;
  simulationRepulsionQuadtreeLevels?: number;
  simulationLinkSpring?: number;
  simulationLinkDistance?: number;
  simulationLinkDistRandomVariationRange?: [number, number];
  simulationRepulsionFromMouse?: number;
  simulationFriction?: number;
  simulationCluster?: number;

  // Interaction
  enableZoom?: boolean;
  enableDrag?: boolean;
  enableSimulationDuringZoom?: boolean;
  enableRightClickRepulsion?: boolean;
  spaceSize?: number;
  useClassicQuadtree?: boolean;

  // View fitting
  fitViewOnInit?: boolean;
  fitViewDelay?: number;
  fitViewDuration?: number;
  fitViewPadding?: number;
  fitViewByPointIndices?: number[];
  initialZoomLevel?: number;

  // Miscellaneous
  rescalePositions?: boolean;
  pointSamplingDistance?: number;
  attribution?: string;
  showFPSMonitor?: boolean;
  randomSeed?: number | string;
}

// ============================================================================
// Callback Types
// ============================================================================

/** Click callback - receives point index (-1 if no point), x, y coordinates */
export type ClickCallback = (pointIndex: number, x: number, y: number) => void;

/** Point click callback - receives point index and position */
export type PointClickCallback = (pointIndex: number, x: number, y: number) => void;

/** Link click callback - receives link index */
export type LinkClickCallback = (linkIndex: number) => void;

/** Background click callback - no parameters */
export type BackgroundClickCallback = () => void;

/** Hover callback - receives point index (-1 when mouse leaves), x, y */
export type HoverCallback = (pointIndex: number, x: number, y: number) => void;

/** Point mouse over callback */
export type PointMouseOverCallback = (pointIndex: number, x: number, y: number) => void;

/** Point mouse out callback */
export type PointMouseOutCallback = () => void;

/** Link mouse over callback */
export type LinkMouseOverCallback = (linkIndex: number) => void;

/** Link mouse out callback */
export type LinkMouseOutCallback = () => void;

/** Mouse move callback */
export type MouseMoveCallback = (pointIndex: number, x: number, y: number) => void;

/** Simulation callbacks */
export interface SimulationCallbacks {
  onStart?: () => void;
  onTick?: (alpha: number, hoveredIndex: number, x: number, y: number) => void;
  onEnd?: () => void;
  onPause?: () => void;
  onUnpause?: () => void;
}

/** Zoom callbacks */
export interface ZoomCallbacks {
  onStart?: (userDriven: boolean) => void;
  onZoom?: (userDriven: boolean) => void;
  onEnd?: (userDriven: boolean) => void;
}

/** Drag callbacks */
export interface DragCallbacks {
  onStart?: () => void;
  onDrag?: () => void;
  onEnd?: () => void;
}

// ============================================================================
// Initialization & Lifecycle
// ============================================================================

/**
 * Creates a new Graph instance in the provided container element.
 * If a graph already exists, it will be destroyed first.
 */
export function createGraph(container: HTMLDivElement, config?: WasmGraphConfig): boolean;

/** Destroys the current Graph instance and releases resources. */
export function destroy(): void;

/** Checks if a Graph instance exists and is ready. */
export function isReady(): boolean;

// ============================================================================
// Data Setters - Point Data
// ============================================================================

/**
 * Sets positions for graph points.
 * @param positions Format: [x1, y1, x2, y2, ..., xn, yn]
 * @param dontRescale If true, skip automatic rescaling
 */
export function setPointPositions(positions: Float32Array, dontRescale?: boolean): void;

/**
 * Sets colors for graph points.
 * @param colors Format: [r1, g1, b1, a1, r2, g2, b2, a2, ...] (values 0-255)
 */
export function setPointColors(colors: Float32Array): void;

/**
 * Sets sizes for graph points.
 * @param sizes Format: [size1, size2, ..., sizen]
 */
export function setPointSizes(sizes: Float32Array): void;

/**
 * Sets shapes for graph points.
 * @param shapes Values: 0=Circle, 1=Square, 2=Triangle, 3=Diamond, 4=Pentagon, 5=Hexagon, 6=Star, 7=Cross, 8=None
 */
export function setPointShapes(shapes: Float32Array): void;

/**
 * Sets per-point repulsion multipliers.
 * @param multipliers 1.0 = normal, 2.0 = double, 0 = use default
 */
export function setPointRepulsionMultipliers(multipliers: Float32Array): void;

// ============================================================================
// Data Setters - Link Data
// ============================================================================

/**
 * Sets links (edges) for the graph.
 * @param links Format: [source1, target1, source2, target2, ...] (point indices)
 */
export function setLinks(links: Float32Array): void;

/**
 * Sets colors for graph links.
 * @param colors Format: [r1, g1, b1, a1, ...] (values 0-255)
 */
export function setLinkColors(colors: Float32Array): void;

/**
 * Sets widths for graph links.
 */
export function setLinkWidths(widths: Float32Array): void;

/**
 * Sets which links should display arrows.
 * @param arrows 0 or 1 for each link
 */
export function setLinkArrows(arrows: Uint8Array): void;

/** Sets link strength coefficients for simulation. */
export function setLinkStrength(strength: Float32Array): void;

/**
 * Sets per-link spring constants.
 * @param springConstants 0 = use global value
 */
export function setLinkSpringConstants(springConstants: Float32Array): void;

// ============================================================================
// Data Setters - Clustering
// ============================================================================

/**
 * Sets point cluster assignments.
 * @param clusters Cluster index for each point, -1 = no cluster
 */
export function setPointClusters(clusters: Float32Array): void;

/**
 * Sets cluster center positions.
 * @param positions [x1, y1, x2, y2, ...], NaN = use centermass
 */
export function setClusterPositions(positions: Float32Array): void;

/** Sets per-point cluster force strength. */
export function setPointClusterStrength(strength: Float32Array): void;

// ============================================================================
// Data Setters - Pinning
// ============================================================================

/**
 * Sets which points are pinned (fixed in position).
 * @param indices Point indices to pin, or null to unpin all
 */
export function setPinnedPoints(indices: Uint32Array | null): void;

// ============================================================================
// Data Getters
// ============================================================================

/** Gets current point positions as [x1, y1, x2, y2, ...] */
export function getPointPositions(): Float32Array;

/** Gets current point colors as [r1, g1, b1, a1, ...] */
export function getPointColors(): Float32Array;

/** Gets current point sizes */
export function getPointSizes(): Float32Array;

/** Gets current link colors */
export function getLinkColors(): Float32Array;

/** Gets current link widths */
export function getLinkWidths(): Float32Array;

/** Gets cluster positions */
export function getClusterPositions(): Float32Array;

/** Gets indices of selected points */
export function getSelectedIndices(): Uint32Array;

/** Gets indices of points adjacent to the given point */
export function getAdjacentIndices(index: number): Uint32Array;

/** Gets point indices within a rectangular screen area */
export function getPointsInRect(left: number, top: number, right: number, bottom: number): Float32Array;

/** Gets tracked point positions as flat array */
export function getTrackedPointPositionsArray(): Float32Array;

/** Gets sampled visible points */
export function getSampledPoints(): { indices: Uint32Array; positions: Float32Array };

// ============================================================================
// Rendering & Simulation Control
// ============================================================================

/**
 * Renders the graph and starts the rendering loop.
 * @param simulationAlpha Optional alpha (0 = static, positive = animate)
 */
export function render(simulationAlpha?: number): void;

/**
 * Starts the simulation.
 * @param alpha Starting energy (0-1, default 1)
 */
export function start(alpha?: number): void;

/** Stops the simulation and resets state. */
export function stop(): void;

/** Pauses the simulation while preserving state. */
export function pause(): void;

/** Unpauses a paused simulation. */
export function unpause(): void;

/** Runs a single simulation step manually. */
export function step(): void;

/** Gets simulation progress (0-1). */
export function getProgress(): number;

/** Returns whether simulation is running. */
export function isSimulationRunning(): boolean;

/** Gets maximum point size supported by hardware. */
export function getMaxPointSize(): number;

// ============================================================================
// View Control
// ============================================================================

/**
 * Fits all points in view.
 * @param duration Animation duration in ms (default 250)
 * @param padding Padding fraction (default 0.1)
 */
export function fitView(duration?: number, padding?: number): void;

/** Fits view to specific points by indices. */
export function fitViewByPointIndices(indices: Uint32Array, duration?: number, padding?: number): void;

/** Fits view to specific positions. */
export function fitViewByPointPositions(positions: Float32Array, duration?: number, padding?: number): void;

/**
 * Zooms to a specific point.
 * @param index Point index
 * @param duration Animation duration (default 700)
 * @param scale Zoom scale (default 3)
 * @param canZoomOut Allow zoom out (default true)
 */
export function zoomToPointByIndex(index: number, duration?: number, scale?: number, canZoomOut?: boolean): void;

/**
 * Sets zoom level.
 * @param value Zoom level
 * @param duration Animation duration (0 = instant)
 */
export function setZoomLevel(value: number, duration?: number): void;

/** Gets current zoom level. */
export function getZoomLevel(): number;

/**
 * Zooms by amount.
 * @param value Zoom amount
 * @param duration Animation duration
 */
export function zoom(value: number, duration?: number): void;

// ============================================================================
// Coordinate Conversion
// ============================================================================

/** Converts space to screen coordinates. */
export function spaceToScreenPosition(x: number, y: number): Float32Array;

/** Converts screen to space coordinates. */
export function screenToSpacePosition(x: number, y: number): Float32Array;

/** Converts radius from space to screen. */
export function spaceToScreenRadius(radius: number): number;

/** Gets point radius by index. */
export function getPointRadiusByIndex(index: number): number;

// ============================================================================
// Selection
// ============================================================================

/**
 * Selects a point by index.
 * @param selectAdjacent Also select adjacent points
 */
export function selectPointByIndex(index: number, selectAdjacent?: boolean): void;

/** Selects multiple points, or null to clear. */
export function selectPointsByIndices(indices: Uint32Array | null): void;

/** Selects points in rectangular screen area. */
export function selectPointsInRect(left: number, top: number, right: number, bottom: number): void;

/** Clears all selections. */
export function unselectPoints(): void;

/** Tracks point positions by indices for efficient updates. */
export function trackPointPositionsByIndices(indices: Uint32Array): void;

// ============================================================================
// Configuration
// ============================================================================

/** Updates graph configuration at runtime. */
export function setConfig(config: Partial<WasmGraphConfig>): void;

// ============================================================================
// Event Callbacks
// ============================================================================

/** Registers click callback. pointIndex is -1 if no point clicked. */
export function onClick(callback: ClickCallback): void;

/** Registers point click callback. */
export function onPointClick(callback: PointClickCallback): void;

/** Registers link click callback. */
export function onLinkClick(callback: LinkClickCallback): void;

/** Registers background click callback. */
export function onBackgroundClick(callback: BackgroundClickCallback): void;

/** Registers hover callback. pointIndex is -1 when leaving point. */
export function onHover(callback: HoverCallback): void;

/** Registers point mouse over callback. */
export function onPointMouseOver(callback: PointMouseOverCallback): void;

/** Registers point mouse out callback. */
export function onPointMouseOut(callback: PointMouseOutCallback): void;

/** Registers link mouse over callback. */
export function onLinkMouseOver(callback: LinkMouseOverCallback): void;

/** Registers link mouse out callback. */
export function onLinkMouseOut(callback: LinkMouseOutCallback): void;

/** Registers mouse move callback. */
export function onMouseMove(callback: MouseMoveCallback): void;

/** Registers simulation callbacks. */
export function onSimulation(callbacks: SimulationCallbacks): void;

/** Registers zoom callbacks. */
export function onZoom(callbacks: ZoomCallbacks): void;

/** Registers drag callbacks. */
export function onDrag(callbacks: DragCallbacks): void;

// ============================================================================
// Utility
// ============================================================================

/** Flattens position pairs to flat array. */
export function flatten(positions: Array<[number, number]>): Float32Array;

/** Converts flat positions to pairs. */
export function pair(positions: Float32Array): Array<[number, number]>;

// ============================================================================
// Constants
// ============================================================================

/** Point shape constants. */
export const POINT_SHAPE: {
  readonly CIRCLE: number;
  readonly SQUARE: number;
  readonly TRIANGLE: number;
  readonly DIAMOND: number;
  readonly PENTAGON: number;
  readonly HEXAGON: number;
  readonly STAR: number;
  readonly CROSS: number;
  readonly NONE: number;
};

/** Gets point shape value by name (lowercase). */
export function getPointShape(name: string): number;
