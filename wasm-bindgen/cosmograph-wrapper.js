/**
 * Cosmograph WASM-bindgen Wrapper
 *
 * This ES module wraps the @cosmos.gl/graph library for use with Rust/WASM via wasm-bindgen.
 * The Graph instance lives in JS-land (module scope) and Rust calls exported functions
 * that operate on it.
 *
 * Usage from Rust:
 *   #[wasm_bindgen(module = "/cosmograph-wrapper.js")]
 *   extern "C" {
 *       fn createGraph(container: &HtmlElement, config: JsValue);
 *       fn setPointPositions(positions: Float32Array);
 *       // ... etc
 *   }
 *
 * IMPORTANT: Float32Array data passed from WASM is a view into WASM linear memory.
 * This wrapper copies data when necessary to avoid issues if WASM memory is resized.
 */

import { Graph, PointShape } from '@cosmos.gl/graph';

// ============================================================================
// Module-scoped Graph Instance
// ============================================================================

/** @type {Graph | null} */
let graphInstance = null;

/** @type {Map<string, Function>} */
const registeredCallbacks = new Map();

// ============================================================================
// Initialization & Lifecycle
// ============================================================================

/**
 * Creates a new Graph instance in the provided container element.
 * If a graph already exists, it will be destroyed first.
 *
 * @param {HTMLDivElement} container - The container element for the graph
 * @param {Object} [config] - Optional configuration object (GraphConfigInterface)
 * @returns {boolean} True if graph was created successfully
 */
export function createGraph(container, config) {
  // Destroy existing instance if present
  if (graphInstance !== null) {
    try {
      graphInstance.destroy();
    } catch (e) {
      console.warn('Error destroying previous graph instance:', e);
    }
    graphInstance = null;
  }

  // Clear registered callbacks
  registeredCallbacks.clear();

  try {
    // Merge user config with any registered callbacks
    const mergedConfig = {
      ...config,
    };

    graphInstance = new Graph(container, mergedConfig);
    return true;
  } catch (e) {
    console.error('Failed to create Graph:', e);
    return false;
  }
}

/**
 * Destroys the current Graph instance and releases resources.
 */
export function destroy() {
  if (graphInstance !== null) {
    try {
      graphInstance.destroy();
    } catch (e) {
      console.warn('Error destroying graph:', e);
    }
    graphInstance = null;
  }
  registeredCallbacks.clear();
}

/**
 * Checks if a Graph instance exists and is ready.
 * @returns {boolean}
 */
export function isReady() {
  return graphInstance !== null;
}

// ============================================================================
// Data Setters - Point Data
// ============================================================================

/**
 * Sets the positions for graph points.
 * Format: [x1, y1, x2, y2, ..., xn, yn]
 *
 * @param {Float32Array} positions - Point positions as flattened x,y pairs
 * @param {boolean} [dontRescale] - If true, skip automatic rescaling
 */
export function setPointPositions(positions, dontRescale) {
  if (graphInstance === null) {
    console.warn('setPointPositions: No graph instance');
    return;
  }
  // Copy the data in case WASM memory is resized
  const copied = new Float32Array(positions);
  graphInstance.setPointPositions(copied, dontRescale);
}

/**
 * Sets the colors for graph points.
 * Format: [r1, g1, b1, a1, r2, g2, b2, a2, ...] where values are 0-255
 *
 * @param {Float32Array} colors - RGBA colors for each point
 */
export function setPointColors(colors) {
  if (graphInstance === null) {
    console.warn('setPointColors: No graph instance');
    return;
  }
  const copied = new Float32Array(colors);
  graphInstance.setPointColors(copied);
}

/**
 * Sets the sizes for graph points.
 * Format: [size1, size2, ..., sizen]
 *
 * @param {Float32Array} sizes - Size for each point
 */
export function setPointSizes(sizes) {
  if (graphInstance === null) {
    console.warn('setPointSizes: No graph instance');
    return;
  }
  const copied = new Float32Array(sizes);
  graphInstance.setPointSizes(copied);
}

/**
 * Sets the shapes for graph points.
 * Values: 0=Circle, 1=Square, 2=Triangle, 3=Diamond, 4=Pentagon, 5=Hexagon, 6=Star, 7=Cross, 8=None
 *
 * @param {Float32Array} shapes - Shape index for each point
 */
export function setPointShapes(shapes) {
  if (graphInstance === null) {
    console.warn('setPointShapes: No graph instance');
    return;
  }
  const copied = new Float32Array(shapes);
  graphInstance.setPointShapes(copied);
}

/**
 * Sets per-point repulsion multipliers for the simulation.
 * A value of 1.0 = normal, 2.0 = double repulsion, 0.5 = half, 0 = use default.
 *
 * @param {Float32Array} multipliers - Repulsion multiplier for each point
 */
export function setPointRepulsionMultipliers(multipliers) {
  if (graphInstance === null) {
    console.warn('setPointRepulsionMultipliers: No graph instance');
    return;
  }
  const copied = new Float32Array(multipliers);
  graphInstance.setPointRepulsionMultipliers(copied);
}

// ============================================================================
// Data Setters - Link Data
// ============================================================================

/**
 * Sets the links (edges) for the graph.
 * Format: [source1, target1, source2, target2, ...] where values are point indices
 *
 * @param {Float32Array} links - Source/target pairs as point indices
 */
export function setLinks(links) {
  if (graphInstance === null) {
    console.warn('setLinks: No graph instance');
    return;
  }
  const copied = new Float32Array(links);
  graphInstance.setLinks(copied);
}

/**
 * Sets the colors for graph links.
 * Format: [r1, g1, b1, a1, r2, g2, b2, a2, ...] where values are 0-255
 *
 * @param {Float32Array} colors - RGBA colors for each link
 */
export function setLinkColors(colors) {
  if (graphInstance === null) {
    console.warn('setLinkColors: No graph instance');
    return;
  }
  const copied = new Float32Array(colors);
  graphInstance.setLinkColors(copied);
}

/**
 * Sets the widths for graph links.
 * Format: [width1, width2, ..., widthn]
 *
 * @param {Float32Array} widths - Width for each link
 */
export function setLinkWidths(widths) {
  if (graphInstance === null) {
    console.warn('setLinkWidths: No graph instance');
    return;
  }
  const copied = new Float32Array(widths);
  graphInstance.setLinkWidths(copied);
}

/**
 * Sets which links should display arrows.
 * Note: This accepts a Uint8Array (treated as booleans) since wasm-bindgen
 * doesn't support boolean arrays directly.
 *
 * @param {Uint8Array} arrows - 0 or 1 for each link indicating arrow display
 */
export function setLinkArrows(arrows) {
  if (graphInstance === null) {
    console.warn('setLinkArrows: No graph instance');
    return;
  }
  // Convert Uint8Array to boolean array
  const boolArray = Array.from(arrows).map(v => v !== 0);
  graphInstance.setLinkArrows(boolArray);
}

/**
 * Sets the strength for graph links (affects simulation forces).
 *
 * @param {Float32Array} strength - Strength coefficient for each link
 */
export function setLinkStrength(strength) {
  if (graphInstance === null) {
    console.warn('setLinkStrength: No graph instance');
    return;
  }
  const copied = new Float32Array(strength);
  graphInstance.setLinkStrength(copied);
}

/**
 * Sets per-link spring constants for the simulation.
 * A value of 0 means "use global simulationLinkSpring value".
 *
 * @param {Float32Array} springConstants - Spring constant for each link
 */
export function setLinkSpringConstants(springConstants) {
  if (graphInstance === null) {
    console.warn('setLinkSpringConstants: No graph instance');
    return;
  }
  const copied = new Float32Array(springConstants);
  graphInstance.setLinkSpringConstants(copied);
}

// ============================================================================
// Data Setters - Clustering
// ============================================================================

/**
 * Sets point cluster assignments.
 * Note: Uses Float32Array with -1 indicating no cluster assignment.
 *
 * @param {Float32Array} clusters - Cluster index for each point (-1 = no cluster)
 */
export function setPointClusters(clusters) {
  if (graphInstance === null) {
    console.warn('setPointClusters: No graph instance');
    return;
  }
  // Convert Float32Array to (number | undefined)[] for the API
  const clusterArray = Array.from(clusters).map(v => v < 0 ? undefined : v);
  graphInstance.setPointClusters(clusterArray);
}

/**
 * Sets cluster positions.
 * Format: [x1, y1, x2, y2, ...] with NaN indicating undefined position (use centermass)
 *
 * @param {Float32Array} positions - Cluster center positions
 */
export function setClusterPositions(positions) {
  if (graphInstance === null) {
    console.warn('setClusterPositions: No graph instance');
    return;
  }
  // Convert NaN to undefined
  const posArray = Array.from(positions).map(v => Number.isNaN(v) ? undefined : v);
  graphInstance.setClusterPositions(posArray);
}

/**
 * Sets per-point cluster force strength coefficients.
 *
 * @param {Float32Array} strength - Cluster strength for each point
 */
export function setPointClusterStrength(strength) {
  if (graphInstance === null) {
    console.warn('setPointClusterStrength: No graph instance');
    return;
  }
  const copied = new Float32Array(strength);
  graphInstance.setPointClusterStrength(copied);
}

// ============================================================================
// Data Setters - Pinning
// ============================================================================

/**
 * Sets which points are pinned (fixed in position).
 * Pinned points don't move due to forces but can still be dragged.
 *
 * @param {Uint32Array | null} indices - Array of point indices to pin, or null to unpin all
 */
export function setPinnedPoints(indices) {
  if (graphInstance === null) {
    console.warn('setPinnedPoints: No graph instance');
    return;
  }
  if (indices === null || indices.length === 0) {
    graphInstance.setPinnedPoints(null);
  } else {
    graphInstance.setPinnedPoints(Array.from(indices));
  }
}

// ============================================================================
// Data Getters
// ============================================================================

/**
 * Gets the current positions of all points.
 * @returns {Float32Array} Positions as [x1, y1, x2, y2, ...]
 */
export function getPointPositions() {
  if (graphInstance === null) {
    console.warn('getPointPositions: No graph instance');
    return new Float32Array(0);
  }
  const positions = graphInstance.getPointPositions();
  return new Float32Array(positions);
}

/**
 * Gets the current colors of all points.
 * @returns {Float32Array} Colors as [r1, g1, b1, a1, ...]
 */
export function getPointColors() {
  if (graphInstance === null) {
    return new Float32Array(0);
  }
  return graphInstance.getPointColors();
}

/**
 * Gets the current sizes of all points.
 * @returns {Float32Array}
 */
export function getPointSizes() {
  if (graphInstance === null) {
    return new Float32Array(0);
  }
  return graphInstance.getPointSizes();
}

/**
 * Gets the current colors of all links.
 * @returns {Float32Array}
 */
export function getLinkColors() {
  if (graphInstance === null) {
    return new Float32Array(0);
  }
  return graphInstance.getLinkColors();
}

/**
 * Gets the current widths of all links.
 * @returns {Float32Array}
 */
export function getLinkWidths() {
  if (graphInstance === null) {
    return new Float32Array(0);
  }
  return graphInstance.getLinkWidths();
}

/**
 * Gets cluster positions.
 * @returns {Float32Array}
 */
export function getClusterPositions() {
  if (graphInstance === null) {
    return new Float32Array(0);
  }
  const positions = graphInstance.getClusterPositions();
  return new Float32Array(positions);
}

/**
 * Gets indices of currently selected points.
 * @returns {Uint32Array}
 */
export function getSelectedIndices() {
  if (graphInstance === null) {
    return new Uint32Array(0);
  }
  const indices = graphInstance.getSelectedIndices();
  if (indices === null) {
    return new Uint32Array(0);
  }
  return new Uint32Array(indices);
}

/**
 * Gets indices of points adjacent to the given point.
 * @param {number} index - Point index
 * @returns {Uint32Array}
 */
export function getAdjacentIndices(index) {
  if (graphInstance === null) {
    return new Uint32Array(0);
  }
  const indices = graphInstance.getAdjacentIndices(index);
  if (indices === undefined) {
    return new Uint32Array(0);
  }
  return new Uint32Array(indices);
}

/**
 * Gets point indices within a rectangular screen area.
 * @param {number} left - Left x coordinate
 * @param {number} top - Top y coordinate
 * @param {number} right - Right x coordinate
 * @param {number} bottom - Bottom y coordinate
 * @returns {Float32Array}
 */
export function getPointsInRect(left, top, right, bottom) {
  if (graphInstance === null) {
    return new Float32Array(0);
  }
  return graphInstance.getPointsInRect([[left, top], [right, bottom]]);
}

/**
 * Gets tracked point positions as a flat array.
 * @returns {Float32Array}
 */
export function getTrackedPointPositionsArray() {
  if (graphInstance === null) {
    return new Float32Array(0);
  }
  const positions = graphInstance.getTrackedPointPositionsArray();
  return new Float32Array(positions);
}

/**
 * Gets sampled visible points (indices and positions).
 * @returns {{ indices: Uint32Array, positions: Float32Array }}
 */
export function getSampledPoints() {
  if (graphInstance === null) {
    return { indices: new Uint32Array(0), positions: new Float32Array(0) };
  }
  const result = graphInstance.getSampledPoints();
  return {
    indices: new Uint32Array(result.indices),
    positions: new Float32Array(result.positions),
  };
}

// ============================================================================
// Rendering & Simulation Control
// ============================================================================

/**
 * Renders the graph and starts the rendering loop.
 * @param {number} [simulationAlpha] - Optional alpha value (0 = static, positive = animate)
 */
export function render(simulationAlpha) {
  if (graphInstance === null) {
    console.warn('render: No graph instance');
    return;
  }
  graphInstance.render(simulationAlpha);
}

/**
 * Starts the simulation with the given alpha value.
 * @param {number} [alpha=1] - Starting alpha (0-1, higher = more energy)
 */
export function start(alpha) {
  if (graphInstance === null) {
    console.warn('start: No graph instance');
    return;
  }
  graphInstance.start(alpha);
}

/**
 * Stops the simulation and resets its state.
 */
export function stop() {
  if (graphInstance === null) {
    return;
  }
  graphInstance.stop();
}

/**
 * Pauses the simulation while preserving its state.
 */
export function pause() {
  if (graphInstance === null) {
    return;
  }
  graphInstance.pause();
}

/**
 * Unpauses (resumes) a paused simulation.
 */
export function unpause() {
  if (graphInstance === null) {
    return;
  }
  graphInstance.unpause();
}

/**
 * Runs a single simulation step manually.
 * Works even when simulation is paused.
 */
export function step() {
  if (graphInstance === null) {
    return;
  }
  graphInstance.step();
}

/**
 * Gets the current simulation progress (0-1).
 * @returns {number}
 */
export function getProgress() {
  if (graphInstance === null) {
    return 0;
  }
  return graphInstance.progress;
}

/**
 * Returns whether the simulation is currently running.
 * @returns {boolean}
 */
export function isSimulationRunning() {
  if (graphInstance === null) {
    return false;
  }
  return graphInstance.isSimulationRunning;
}

/**
 * Gets the maximum point size supported by the hardware.
 * @returns {number}
 */
export function getMaxPointSize() {
  if (graphInstance === null) {
    return 0;
  }
  return graphInstance.maxPointSize;
}

// ============================================================================
// View Control
// ============================================================================

/**
 * Centers and zooms to fit all points in the view.
 * @param {number} [duration=250] - Animation duration in ms
 * @param {number} [padding=0.1] - Padding around viewport (0-1)
 */
export function fitView(duration, padding) {
  if (graphInstance === null) {
    console.warn('fitView: No graph instance');
    return;
  }
  graphInstance.fitView(duration, padding);
}

/**
 * Fits the view to specific points by their indices.
 * @param {Uint32Array} indices - Point indices to fit
 * @param {number} [duration=250] - Animation duration
 * @param {number} [padding=0.1] - Padding
 */
export function fitViewByPointIndices(indices, duration, padding) {
  if (graphInstance === null) {
    return;
  }
  graphInstance.fitViewByPointIndices(Array.from(indices), duration, padding);
}

/**
 * Fits the view to specific point positions.
 * @param {Float32Array} positions - [x1, y1, x2, y2, ...] positions to fit
 * @param {number} [duration=250] - Animation duration
 * @param {number} [padding=0.1] - Padding
 */
export function fitViewByPointPositions(positions, duration, padding) {
  if (graphInstance === null) {
    return;
  }
  graphInstance.fitViewByPointPositions(Array.from(positions), duration, padding);
}

/**
 * Zooms to a specific point by index.
 * @param {number} index - Point index
 * @param {number} [duration=700] - Animation duration
 * @param {number} [scale=3] - Zoom scale
 * @param {boolean} [canZoomOut=true] - Allow zooming out
 */
export function zoomToPointByIndex(index, duration, scale, canZoomOut) {
  if (graphInstance === null) {
    return;
  }
  graphInstance.zoomToPointByIndex(index, duration, scale, canZoomOut);
}

/**
 * Sets the zoom level.
 * @param {number} value - Zoom level
 * @param {number} [duration=0] - Animation duration (0 = instant)
 */
export function setZoomLevel(value, duration) {
  if (graphInstance === null) {
    return;
  }
  graphInstance.setZoomLevel(value, duration);
}

/**
 * Gets the current zoom level.
 * @returns {number}
 */
export function getZoomLevel() {
  if (graphInstance === null) {
    return 1;
  }
  return graphInstance.getZoomLevel();
}

/**
 * Zooms in or out by the specified value.
 * @param {number} value - Zoom amount
 * @param {number} [duration=0] - Animation duration
 */
export function zoom(value, duration) {
  if (graphInstance === null) {
    return;
  }
  graphInstance.zoom(value, duration);
}

// ============================================================================
// Coordinate Conversion
// ============================================================================

/**
 * Converts space coordinates to screen coordinates.
 * @param {number} x - Space x coordinate
 * @param {number} y - Space y coordinate
 * @returns {Float32Array} [screenX, screenY]
 */
export function spaceToScreenPosition(x, y) {
  if (graphInstance === null) {
    return new Float32Array([0, 0]);
  }
  const result = graphInstance.spaceToScreenPosition([x, y]);
  return new Float32Array(result);
}

/**
 * Converts screen coordinates to space coordinates.
 * @param {number} x - Screen x coordinate
 * @param {number} y - Screen y coordinate
 * @returns {Float32Array} [spaceX, spaceY]
 */
export function screenToSpacePosition(x, y) {
  if (graphInstance === null) {
    return new Float32Array([0, 0]);
  }
  const result = graphInstance.screenToSpacePosition([x, y]);
  return new Float32Array(result);
}

/**
 * Converts a radius from space to screen coordinates.
 * @param {number} radius - Space radius
 * @returns {number} Screen radius
 */
export function spaceToScreenRadius(radius) {
  if (graphInstance === null) {
    return 0;
  }
  return graphInstance.spaceToScreenRadius(radius);
}

/**
 * Gets the radius of a point by its index.
 * @param {number} index - Point index
 * @returns {number}
 */
export function getPointRadiusByIndex(index) {
  if (graphInstance === null) {
    return 0;
  }
  return graphInstance.getPointRadiusByIndex(index) ?? 0;
}

// ============================================================================
// Selection
// ============================================================================

/**
 * Selects a point by index.
 * @param {number} index - Point index
 * @param {boolean} [selectAdjacent=false] - Also select adjacent points
 */
export function selectPointByIndex(index, selectAdjacent) {
  if (graphInstance === null) {
    return;
  }
  graphInstance.selectPointByIndex(index, selectAdjacent);
}

/**
 * Selects multiple points by indices.
 * @param {Uint32Array | null} indices - Point indices to select, or null to clear
 */
export function selectPointsByIndices(indices) {
  if (graphInstance === null) {
    return;
  }
  if (indices === null || indices.length === 0) {
    graphInstance.selectPointsByIndices(null);
  } else {
    graphInstance.selectPointsByIndices(Array.from(indices));
  }
}

/**
 * Selects points within a rectangular screen area.
 * @param {number} left - Left x
 * @param {number} top - Top y
 * @param {number} right - Right x
 * @param {number} bottom - Bottom y
 */
export function selectPointsInRect(left, top, right, bottom) {
  if (graphInstance === null) {
    return;
  }
  graphInstance.selectPointsInRect([[left, top], [right, bottom]]);
}

/**
 * Clears all point selections.
 */
export function unselectPoints() {
  if (graphInstance === null) {
    return;
  }
  graphInstance.unselectPoints();
}

/**
 * Tracks point positions by their indices for efficient updates.
 * @param {Uint32Array} indices - Point indices to track
 */
export function trackPointPositionsByIndices(indices) {
  if (graphInstance === null) {
    return;
  }
  graphInstance.trackPointPositionsByIndices(Array.from(indices));
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Updates the graph configuration at runtime.
 * @param {Object} config - Partial configuration object
 */
export function setConfig(config) {
  if (graphInstance === null) {
    console.warn('setConfig: No graph instance');
    return;
  }

  // Merge any registered callbacks into the config
  const mergedConfig = { ...config };

  graphInstance.setConfig(mergedConfig);
}

// ============================================================================
// Event Callbacks
// ============================================================================

/**
 * Registers a click callback.
 * The callback receives (pointIndex, x, y) where pointIndex is -1 if no point was clicked.
 *
 * @param {Function} callback - (pointIndex: number, x: number, y: number) => void
 */
export function onClick(callback) {
  if (graphInstance === null) {
    console.warn('onClick: No graph instance - callback will be registered when graph is created');
    registeredCallbacks.set('onClick', callback);
    return;
  }

  graphInstance.setConfig({
    onClick: (index, position, _event) => {
      callback(
        index ?? -1,
        position?.[0] ?? 0,
        position?.[1] ?? 0
      );
    }
  });
}

/**
 * Registers a point click callback.
 * @param {Function} callback - (pointIndex: number, x: number, y: number) => void
 */
export function onPointClick(callback) {
  if (graphInstance === null) {
    registeredCallbacks.set('onPointClick', callback);
    return;
  }

  graphInstance.setConfig({
    onPointClick: (index, position, _event) => {
      callback(index, position[0], position[1]);
    }
  });
}

/**
 * Registers a link click callback.
 * @param {Function} callback - (linkIndex: number) => void
 */
export function onLinkClick(callback) {
  if (graphInstance === null) {
    registeredCallbacks.set('onLinkClick', callback);
    return;
  }

  graphInstance.setConfig({
    onLinkClick: (linkIndex, _event) => {
      callback(linkIndex);
    }
  });
}

/**
 * Registers a background click callback.
 * @param {Function} callback - () => void
 */
export function onBackgroundClick(callback) {
  if (graphInstance === null) {
    registeredCallbacks.set('onBackgroundClick', callback);
    return;
  }

  graphInstance.setConfig({
    onBackgroundClick: (_event) => {
      callback();
    }
  });
}

/**
 * Registers a hover callback (point mouse over).
 * Callback receives pointIndex and position, or (-1, 0, 0) when mouse moves off point.
 *
 * @param {Function} callback - (pointIndex: number, x: number, y: number) => void
 */
export function onHover(callback) {
  if (graphInstance === null) {
    registeredCallbacks.set('onHover', callback);
    return;
  }

  graphInstance.setConfig({
    onPointMouseOver: (index, position, _event) => {
      callback(index, position[0], position[1]);
    },
    onPointMouseOut: (_event) => {
      callback(-1, 0, 0);
    }
  });
}

/**
 * Registers a point mouse over callback.
 * @param {Function} callback - (pointIndex: number, x: number, y: number) => void
 */
export function onPointMouseOver(callback) {
  if (graphInstance === null) {
    registeredCallbacks.set('onPointMouseOver', callback);
    return;
  }

  graphInstance.setConfig({
    onPointMouseOver: (index, position, _event) => {
      callback(index, position[0], position[1]);
    }
  });
}

/**
 * Registers a point mouse out callback.
 * @param {Function} callback - () => void
 */
export function onPointMouseOut(callback) {
  if (graphInstance === null) {
    registeredCallbacks.set('onPointMouseOut', callback);
    return;
  }

  graphInstance.setConfig({
    onPointMouseOut: (_event) => {
      callback();
    }
  });
}

/**
 * Registers a link mouse over callback.
 * @param {Function} callback - (linkIndex: number) => void
 */
export function onLinkMouseOver(callback) {
  if (graphInstance === null) {
    registeredCallbacks.set('onLinkMouseOver', callback);
    return;
  }

  graphInstance.setConfig({
    onLinkMouseOver: (linkIndex) => {
      callback(linkIndex);
    }
  });
}

/**
 * Registers a link mouse out callback.
 * @param {Function} callback - () => void
 */
export function onLinkMouseOut(callback) {
  if (graphInstance === null) {
    registeredCallbacks.set('onLinkMouseOut', callback);
    return;
  }

  graphInstance.setConfig({
    onLinkMouseOut: (_event) => {
      callback();
    }
  });
}

/**
 * Registers a mouse move callback.
 * @param {Function} callback - (pointIndex: number, x: number, y: number) => void
 */
export function onMouseMove(callback) {
  if (graphInstance === null) {
    registeredCallbacks.set('onMouseMove', callback);
    return;
  }

  graphInstance.setConfig({
    onMouseMove: (index, position, _event) => {
      callback(
        index ?? -1,
        position?.[0] ?? 0,
        position?.[1] ?? 0
      );
    }
  });
}

/**
 * Registers simulation event callbacks.
 * @param {Object} callbacks - { onStart?, onTick?, onEnd?, onPause?, onUnpause? }
 */
export function onSimulation(callbacks) {
  if (graphInstance === null) {
    registeredCallbacks.set('onSimulation', callbacks);
    return;
  }

  const config = {};

  if (callbacks.onStart) {
    config.onSimulationStart = callbacks.onStart;
  }
  if (callbacks.onTick) {
    config.onSimulationTick = (alpha, hoveredIndex, position) => {
      callbacks.onTick(
        alpha,
        hoveredIndex ?? -1,
        position?.[0] ?? 0,
        position?.[1] ?? 0
      );
    };
  }
  if (callbacks.onEnd) {
    config.onSimulationEnd = callbacks.onEnd;
  }
  if (callbacks.onPause) {
    config.onSimulationPause = callbacks.onPause;
  }
  if (callbacks.onUnpause) {
    config.onSimulationUnpause = callbacks.onUnpause;
  }

  graphInstance.setConfig(config);
}

/**
 * Registers zoom event callbacks.
 * @param {Object} callbacks - { onStart?, onZoom?, onEnd? }
 */
export function onZoom(callbacks) {
  if (graphInstance === null) {
    registeredCallbacks.set('onZoom', callbacks);
    return;
  }

  const config = {};

  if (callbacks.onStart) {
    config.onZoomStart = (event, userDriven) => {
      callbacks.onStart(userDriven);
    };
  }
  if (callbacks.onZoom) {
    config.onZoom = (event, userDriven) => {
      callbacks.onZoom(userDriven);
    };
  }
  if (callbacks.onEnd) {
    config.onZoomEnd = (event, userDriven) => {
      callbacks.onEnd(userDriven);
    };
  }

  graphInstance.setConfig(config);
}

/**
 * Registers drag event callbacks.
 * @param {Object} callbacks - { onStart?, onDrag?, onEnd? }
 */
export function onDrag(callbacks) {
  if (graphInstance === null) {
    registeredCallbacks.set('onDrag', callbacks);
    return;
  }

  const config = {};

  if (callbacks.onStart) {
    config.onDragStart = (_event) => {
      callbacks.onStart();
    };
  }
  if (callbacks.onDrag) {
    config.onDrag = (_event) => {
      callbacks.onDrag();
    };
  }
  if (callbacks.onEnd) {
    config.onDragEnd = (_event) => {
      callbacks.onEnd();
    };
  }

  graphInstance.setConfig(config);
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Flattens an array of position pairs to a flat array.
 * @param {Array<[number, number]>} positions - Array of [x, y] pairs
 * @returns {Float32Array}
 */
export function flatten(positions) {
  if (graphInstance === null) {
    return new Float32Array(positions.flat());
  }
  return new Float32Array(graphInstance.flatten(positions));
}

/**
 * Converts a flat position array to pairs.
 * @param {Float32Array} positions - Flat [x1, y1, x2, y2, ...] array
 * @returns {Array<[number, number]>}
 */
export function pair(positions) {
  if (graphInstance === null) {
    const result = [];
    for (let i = 0; i < positions.length; i += 2) {
      result.push([positions[i], positions[i + 1]]);
    }
    return result;
  }
  return graphInstance.pair(Array.from(positions));
}

// ============================================================================
// Constants Export
// ============================================================================

/**
 * Point shape constants.
 */
export const POINT_SHAPE = {
  CIRCLE: PointShape.Circle,
  SQUARE: PointShape.Square,
  TRIANGLE: PointShape.Triangle,
  DIAMOND: PointShape.Diamond,
  PENTAGON: PointShape.Pentagon,
  HEXAGON: PointShape.Hexagon,
  STAR: PointShape.Star,
  CROSS: PointShape.Cross,
  NONE: PointShape.None,
};

/**
 * Gets a point shape value by name.
 * @param {string} name - Shape name (lowercase)
 * @returns {number}
 */
export function getPointShape(name) {
  const shapes = {
    circle: PointShape.Circle,
    square: PointShape.Square,
    triangle: PointShape.Triangle,
    diamond: PointShape.Diamond,
    pentagon: PointShape.Pentagon,
    hexagon: PointShape.Hexagon,
    star: PointShape.Star,
    cross: PointShape.Cross,
    none: PointShape.None,
  };
  return shapes[name.toLowerCase()] ?? PointShape.Circle;
}
