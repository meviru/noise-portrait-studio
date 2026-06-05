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
 * Generates a staggered hexagonal dot grid where each dot's radius is proportional
 * to local darkness, producing a classic offset-print / CMYK halftone look.
 *
 * @param config - Halftone generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of dot positions and radii; near-invisible dots (r < 0.1) are omitted
 */
export function generateHalftone(
  config: HalftoneConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): DotItem[] {
  const dots: DotItem[] = []
  const gridSize = Math.sqrt((config.canvasWidth * config.canvasHeight) / config.density)
  const rows = Math.ceil(config.canvasHeight / gridSize) + 1
  const cols = Math.ceil(config.canvasWidth / gridSize) + 1

  for (let row = 0; row < rows; row++) {
    const cy = (row + 0.5) * gridSize
    // Stagger every other row by half a cell for a hexagonal grid
    const xOffset = (row % 2) * (gridSize / 2)

    for (let col = 0; col < cols; col++) {
      const cx = col * gridSize + xOffset

      if (cx > config.canvasWidth + gridSize / 2) continue

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
