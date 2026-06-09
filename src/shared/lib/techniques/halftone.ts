import { mapRange } from '@/shared/lib/utils/mapRange'
import { sampleBrightness } from './imageUtils'
import type { DotItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for halftone dot generation. */
export interface HalftoneConfig {
  canvasWidth: number
  canvasHeight: number
  density: number
  minSize: number
  maxSize: number
}

/**
 * Generates a halftone dot grid at a 45° screen angle.
 * The diagonal orientation prevents moiré patterns and gives the output an
 * authentic offset-print character. Each dot's radius is proportional to
 * local darkness; dots below the minimum visible size are omitted.
 *
 * @param config - Halftone generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of dot positions and radii
 */
export function generateHalftone(
  config: HalftoneConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): DotItem[] {
  const dots: DotItem[] = []
  const gridSize = Math.sqrt((config.canvasWidth * config.canvasHeight) / config.density)

  // 45° screen angle — standard mono halftone rotation
  const ANGLE = Math.PI / 4
  const cosA = Math.cos(ANGLE)
  const sinA = Math.sin(ANGLE)
  const cx0 = config.canvasWidth / 2
  const cy0 = config.canvasHeight / 2

  // Span large enough so the rotated grid covers every canvas corner
  const span = Math.ceil(
    Math.sqrt(config.canvasWidth ** 2 + config.canvasHeight ** 2) / gridSize
  ) + 2

  for (let row = -span; row <= span; row++) {
    // Stagger alternating rows by half a cell (hexagonal packing)
    const stagger = (((row % 2) + 2) % 2) * (gridSize / 2)

    for (let col = -span; col <= span; col++) {
      // Grid-space position (unrotated)
      const gx = col * gridSize + stagger
      const gy = row * gridSize

      // Rotate into canvas space around the canvas centre
      const cx = cx0 + gx * cosA - gy * sinA
      const cy = cy0 + gx * sinA + gy * cosA

      // Skip dots that fall outside the canvas (with one cell of slack)
      if (cx < -gridSize || cx > config.canvasWidth + gridSize) continue
      if (cy < -gridSize || cy > config.canvasHeight + gridSize) continue

      const brightness = sampleBrightness(
        cx, cy,
        brightnessMap, mapWidth, mapHeight,
        config.canvasWidth, config.canvasHeight
      )

      const r = mapRange(1 - brightness, 0, 1, config.minSize, config.maxSize)
      if (r < 0.1) continue

      dots.push({ x: cx, y: cy, r })
    }
  }

  return dots
}
