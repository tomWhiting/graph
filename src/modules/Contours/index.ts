import regl from 'regl'
import { CoreModule } from '@/graph/modules/core-module'
import { createQuadBuffer } from '@/graph/modules/Shared/buffer'
import contourVert from '@/graph/modules/Contours/contour.vert'
import contourFrag from '@/graph/modules/Contours/contour.frag'
import {
  ContourGroup,
  ContourGroupConfig,
  ContoursConfig,
  DEFAULT_CONTOURS_CONFIG,
  DEFAULT_CONTOUR_LEVELS,
} from './types'

// Re-export types
export * from './types'

// Maximum levels supported by the shader
const MAX_LEVELS = 16

/**
 * Parses a color string or array into [r, g, b, a] normalized to 0-1
 */
function parseColor (color: string | [number, number, number, number]): [number, number, number, number] {
  if (Array.isArray(color)) {
    // Assume values are 0-255 if any > 1, otherwise 0-1
    const isNormalized = color.every(c => c <= 1)
    if (isNormalized) return color
    return [color[0] / 255, color[1] / 255, color[2] / 255, color[3] / 255]
  }

  // Parse string color (hex or rgba)
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      return [r, g, b, 1]
    } else if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      const a = parseInt(hex.slice(6, 8), 16) / 255
      return [r, g, b, a]
    }
  }

  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
    if (match && match[1] && match[2] && match[3]) {
      return [
        parseInt(match[1], 10) / 255,
        parseInt(match[2], 10) / 255,
        parseInt(match[3], 10) / 255,
        match[4] ? parseFloat(match[4]) : 1,
      ]
    }
  }

  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    if (match && match[1] && match[2] && match[3]) {
      return [
        parseInt(match[1], 10) / 255,
        parseInt(match[2], 10) / 255,
        parseInt(match[3], 10) / 255,
        1,
      ]
    }
  }

  // Default fallback
  return [0.5, 0.5, 0.5, 0.5]
}

/**
 * ContoursModule - Renders metaball/contour effects around groups of nodes
 *
 * Features:
 * - Multiple contour groups with different colors/styles
 * - Gradient levels (topographic/heat map effect)
 * - Optional borders around groups
 * - Smooth organic boundaries using metaball algorithm
 */
export class Contours extends CoreModule {
  private drawCommand: regl.DrawCommand | undefined
  private groups: Map<string, ContourGroup> = new Map()
  private contoursConfig: ContoursConfig = { ...DEFAULT_CONTOURS_CONFIG }

  /**
   * Initialize the WebGL programs for contour rendering
   */
  public initPrograms (): void {
    const { reglInstance, store } = this

    if (!this.drawCommand) {
      this.drawCommand = reglInstance({
        vert: contourVert,
        frag: contourFrag,
        attributes: {
          vertexCoord: createQuadBuffer(reglInstance),
        },
        uniforms: {
          // Main positions texture from Cosmograph
          positionsTexture: () => this.points?.currentPositionFbo,
          pointsTextureSize: () => store.pointsTextureSize,

          // Group-specific uniforms (set per draw call)
          groupIndicesTexture: reglInstance.prop('groupIndicesTexture'),
          nodeCount: reglInstance.prop('nodeCount'),
          groupTextureWidth: reglInstance.prop('groupTextureWidth'),
          radius: reglInstance.prop('radius'),
          feather: reglInstance.prop('feather'),
          levelCount: reglInstance.prop('levelCount'),
          hasBorder: reglInstance.prop('hasBorder'),
          borderColor: reglInstance.prop('borderColor'),
          borderThickness: reglInstance.prop('borderThickness'),
          outerThreshold: reglInstance.prop('outerThreshold'),

          // Individual level thresholds
          levelThreshold0: reglInstance.prop('levelThreshold0'),
          levelThreshold1: reglInstance.prop('levelThreshold1'),
          levelThreshold2: reglInstance.prop('levelThreshold2'),
          levelThreshold3: reglInstance.prop('levelThreshold3'),
          levelThreshold4: reglInstance.prop('levelThreshold4'),
          levelThreshold5: reglInstance.prop('levelThreshold5'),
          levelThreshold6: reglInstance.prop('levelThreshold6'),
          levelThreshold7: reglInstance.prop('levelThreshold7'),
          levelThreshold8: reglInstance.prop('levelThreshold8'),
          levelThreshold9: reglInstance.prop('levelThreshold9'),
          levelThreshold10: reglInstance.prop('levelThreshold10'),
          levelThreshold11: reglInstance.prop('levelThreshold11'),
          levelThreshold12: reglInstance.prop('levelThreshold12'),
          levelThreshold13: reglInstance.prop('levelThreshold13'),
          levelThreshold14: reglInstance.prop('levelThreshold14'),
          levelThreshold15: reglInstance.prop('levelThreshold15'),

          // Individual level colors
          levelColor0: reglInstance.prop('levelColor0'),
          levelColor1: reglInstance.prop('levelColor1'),
          levelColor2: reglInstance.prop('levelColor2'),
          levelColor3: reglInstance.prop('levelColor3'),
          levelColor4: reglInstance.prop('levelColor4'),
          levelColor5: reglInstance.prop('levelColor5'),
          levelColor6: reglInstance.prop('levelColor6'),
          levelColor7: reglInstance.prop('levelColor7'),
          levelColor8: reglInstance.prop('levelColor8'),
          levelColor9: reglInstance.prop('levelColor9'),
          levelColor10: reglInstance.prop('levelColor10'),
          levelColor11: reglInstance.prop('levelColor11'),
          levelColor12: reglInstance.prop('levelColor12'),
          levelColor13: reglInstance.prop('levelColor13'),
          levelColor14: reglInstance.prop('levelColor14'),
          levelColor15: reglInstance.prop('levelColor15'),

          // Camera/transform uniforms
          transformationMatrix: () => store.transform,
          spaceSize: () => store.adjustedSpaceSize,
          screenSize: () => store.screenSize,
        },
        blend: {
          enable: true,
          func: {
            srcRGB: 'src alpha',
            srcAlpha: 'one',
            dstRGB: 'one minus src alpha',
            dstAlpha: 'one minus src alpha',
          },
          equation: {
            rgb: 'add',
            alpha: 'add',
          },
        },
        depth: {
          enable: false,
          mask: false,
        },
        count: 4,
        primitive: 'triangle strip',
      })
    }
  }

  /**
   * Set the overall contours configuration
   */
  public setConfig (config: Partial<ContoursConfig>): void {
    this.contoursConfig = { ...this.contoursConfig, ...config }
  }

  /**
   * Add or update a contour group
   */
  public setGroup (id: string, config: ContourGroupConfig): void {
    const existingGroup = this.groups.get(id)

    // Sort levels by threshold descending (highest first)
    const levels = (config.levels ?? this.contoursConfig.defaultLevels ?? DEFAULT_CONTOUR_LEVELS)
      .slice()
      .sort((a, b) => b.threshold - a.threshold)

    const group: ContourGroup = {
      id,
      pointIndices: new Float32Array(config.pointIndices),
      radius: config.radius ?? this.contoursConfig.defaultRadius,
      levels,
      border: config.border ?? null,
      feather: config.feather ?? 1.5,
      visible: config.visible ?? true,
      indicesTexture: existingGroup?.indicesTexture as regl.Texture2D | undefined,
      needsUpdate: true,
    }

    this.groups.set(id, group)
    this.updateGroupTexture(group)
  }

  /**
   * Set multiple groups at once
   */
  public setGroups (groups: Record<string, ContourGroupConfig>): void {
    // Clear existing groups
    this.clearGroups()

    // Add new groups
    for (const [id, config] of Object.entries(groups)) {
      this.setGroup(id, config)
    }
  }

  /**
   * Remove a contour group
   */
  public removeGroup (id: string): void {
    const group = this.groups.get(id)
    if (group?.indicesTexture) {
      (group.indicesTexture as regl.Texture2D).destroy()
    }
    this.groups.delete(id)
  }

  /**
   * Clear all contour groups
   */
  public clearGroups (): void {
    for (const group of this.groups.values()) {
      if (group.indicesTexture) {
        (group.indicesTexture as regl.Texture2D).destroy()
      }
    }
    this.groups.clear()
  }

  /**
   * Mark all groups as needing texture updates (call when indices change)
   */
  public markAllGroupsForUpdate (): void {
    for (const group of this.groups.values()) {
      group.needsUpdate = true
    }
  }

  /**
   * Draw all visible contour groups
   */
  public draw (): void {
    if (!this.contoursConfig.enabled) return
    if (!this.drawCommand) return
    if (this.groups.size === 0) return
    if (!this.points?.currentPositionFbo) return

    const defaultColor: [number, number, number, number] = [0, 0, 0, 0]

    for (const group of this.groups.values()) {
      if (!group.visible) continue
      if (group.pointIndices.length === 0) continue

      // Update texture if needed
      if (group.needsUpdate) {
        this.updateGroupTexture(group)
      }

      if (!group.indicesTexture) continue

      // Prepare level data (padded to MAX_LEVELS)
      const thresholds: number[] = []
      const colors: [number, number, number, number][] = []

      for (let i = 0; i < MAX_LEVELS; i++) {
        const level = group.levels[i]
        if (level) {
          thresholds.push(level.threshold)
          colors.push(parseColor(level.color))
        } else {
          thresholds.push(0)
          colors.push(defaultColor)
        }
      }

      // Get outermost threshold (last level, which has lowest threshold after sorting)
      const outerThreshold = group.levels.length > 0
        ? group.levels[group.levels.length - 1]?.threshold ?? 0.5
        : 0.5

      // Draw this group
      this.drawCommand({
        groupIndicesTexture: group.indicesTexture as regl.Texture2D,
        nodeCount: group.pointIndices.length,
        groupTextureWidth: group.pointIndices.length,
        radius: group.radius,
        feather: group.feather,
        levelCount: group.levels.length,
        hasBorder: group.border !== null ? 1 : 0,
        borderColor: group.border ? parseColor(group.border.color) : defaultColor,
        borderThickness: group.border?.thickness ?? 0,
        outerThreshold,
        levelThreshold0: thresholds[0] ?? 0,
        levelThreshold1: thresholds[1] ?? 0,
        levelThreshold2: thresholds[2] ?? 0,
        levelThreshold3: thresholds[3] ?? 0,
        levelThreshold4: thresholds[4] ?? 0,
        levelThreshold5: thresholds[5] ?? 0,
        levelThreshold6: thresholds[6] ?? 0,
        levelThreshold7: thresholds[7] ?? 0,
        levelThreshold8: thresholds[8] ?? 0,
        levelThreshold9: thresholds[9] ?? 0,
        levelThreshold10: thresholds[10] ?? 0,
        levelThreshold11: thresholds[11] ?? 0,
        levelThreshold12: thresholds[12] ?? 0,
        levelThreshold13: thresholds[13] ?? 0,
        levelThreshold14: thresholds[14] ?? 0,
        levelThreshold15: thresholds[15] ?? 0,
        levelColor0: colors[0] ?? defaultColor,
        levelColor1: colors[1] ?? defaultColor,
        levelColor2: colors[2] ?? defaultColor,
        levelColor3: colors[3] ?? defaultColor,
        levelColor4: colors[4] ?? defaultColor,
        levelColor5: colors[5] ?? defaultColor,
        levelColor6: colors[6] ?? defaultColor,
        levelColor7: colors[7] ?? defaultColor,
        levelColor8: colors[8] ?? defaultColor,
        levelColor9: colors[9] ?? defaultColor,
        levelColor10: colors[10] ?? defaultColor,
        levelColor11: colors[11] ?? defaultColor,
        levelColor12: colors[12] ?? defaultColor,
        levelColor13: colors[13] ?? defaultColor,
        levelColor14: colors[14] ?? defaultColor,
        levelColor15: colors[15] ?? defaultColor,
      })
    }
  }

  /**
   * Check if contours rendering is enabled
   */
  public isEnabled (): boolean {
    return this.contoursConfig.enabled
  }

  /**
   * Get the number of groups
   */
  public getGroupCount (): number {
    return this.groups.size
  }

  /**
   * Cleanup resources
   */
  public destroy (): void {
    this.clearGroups()
  }

  /**
   * Create/update the indices texture for a group
   * This texture contains the point indices that belong to this group
   */
  private updateGroupTexture (group: ContourGroup): void {
    const { reglInstance } = this

    const nodeCount = group.pointIndices.length
    if (nodeCount === 0) return

    // Calculate texture width (1D texture, height = 1)
    const textureWidth = nodeCount

    // Create or update the texture
    // We use 'alpha' format for single-channel float data containing indices
    if (!group.indicesTexture) {
      group.indicesTexture = reglInstance.texture({
        width: textureWidth,
        height: 1,
        format: 'alpha',
        type: 'float',
        data: group.pointIndices,
        min: 'nearest',
        mag: 'nearest',
        wrap: 'clamp',
      })
    } else {
      (group.indicesTexture as regl.Texture2D)({
        width: textureWidth,
        height: 1,
        format: 'alpha',
        type: 'float',
        data: group.pointIndices,
      })
    }

    group.needsUpdate = false
  }
}
