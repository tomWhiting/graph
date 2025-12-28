/**
 * Configuration for a single contour level (threshold band)
 */
export interface ContourLevel {
  /** The score threshold for this level (0.0 - 1.0+) */
  threshold: number;
  /** Color for this level (hex string or rgba array) */
  color: string | [number, number, number, number];
}

/**
 * Border/outline configuration for a contour group
 */
export interface ContourBorder {
  /** Border color (hex string or rgba array) */
  color: string | [number, number, number, number];
  /** Border thickness in pixels */
  thickness: number;
}

/**
 * Configuration for a single contour group
 */
export interface ContourGroupConfig {
  /** Array of point indices that belong to this group */
  pointIndices: number[];
  /** Radius of influence for each point (in space units) */
  radius?: number;
  /** Contour levels - multiple creates gradient/topographic effect */
  levels?: ContourLevel[];
  /** Optional border around the outermost contour */
  border?: ContourBorder;
  /** Feather amount for anti-aliasing (default: 1.5) */
  feather?: number;
  /** Whether this group is visible */
  visible?: boolean;
}

/**
 * Internal representation of a parsed contour group
 */
export interface ContourGroup {
  id: string;
  pointIndices: Float32Array;
  radius: number;
  levels: ContourLevel[];
  border: ContourBorder | null;
  feather: number;
  visible: boolean;
  /** Texture containing point indices for this group (sampled by shader) */
  indicesTexture?: unknown; // regl.Texture2D - avoiding import cycle
  /** Whether the texture needs updating */
  needsUpdate: boolean;
}

/**
 * Options for the entire contours system
 */
export interface ContoursConfig {
  /** Whether contours rendering is enabled */
  enabled: boolean;
  /** Default radius if not specified per-group */
  defaultRadius: number;
  /** Default levels if not specified per-group */
  defaultLevels: ContourLevel[];
  /** Render contours behind points (true) or in front (false) */
  renderBehindPoints: boolean;
}

/**
 * Default contour levels - creates a nice gradient effect
 */
export const DEFAULT_CONTOUR_LEVELS: ContourLevel[] = [
  { threshold: 0.5, color: 'rgba(100, 100, 255, 0.3)' },
]

/**
 * Default multi-level gradient (topographic style)
 */
export const GRADIENT_CONTOUR_LEVELS: ContourLevel[] = [
  { threshold: 0.9, color: 'rgba(255, 255, 255, 0.9)' },
  { threshold: 0.8, color: 'rgba(255, 230, 230, 0.8)' },
  { threshold: 0.7, color: 'rgba(255, 200, 200, 0.7)' },
  { threshold: 0.6, color: 'rgba(255, 150, 150, 0.6)' },
  { threshold: 0.5, color: 'rgba(255, 100, 150, 0.5)' },
  { threshold: 0.4, color: 'rgba(220, 50, 150, 0.4)' },
  { threshold: 0.3, color: 'rgba(175, 0, 125, 0.3)' },
  { threshold: 0.2, color: 'rgba(125, 0, 120, 0.2)' },
  { threshold: 0.1, color: 'rgba(75, 0, 105, 0.1)' },
]

export const DEFAULT_CONTOURS_CONFIG: ContoursConfig = {
  enabled: true,
  defaultRadius: 150,
  defaultLevels: DEFAULT_CONTOUR_LEVELS,
  renderBehindPoints: true,
}
