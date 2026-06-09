import { sampleBrightness } from './imageUtils'
import type { RectItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for mosaic tile generation. */
export interface MosaicConfig {
  canvasWidth: number
  canvasHeight: number
  density: number // tiles per row
  brightnessMap: Float32Array
  mapWidth: number
  mapHeight: number
}

/**
 * Generates a brightness-responsive mosaic grid.
 * Each tile is centred in its cell; its size scales with local darkness so
 * dark portrait areas (eyes, lips, shadows) have large tiles that nearly fill
 * the cell, while bright highlight areas have smaller tiles with visible grout.
 *
 * @param config - Mosaic generation parameters including brightness map
 * @returns Array of tile rectangles
 */
export function generateMosaic(config: MosaicConfig): RectItem[] {
  const rects: RectItem[] = []
  const tileSize = config.canvasWidth / config.density
  const numCols = config.density
  const numRows = Math.ceil(config.canvasHeight / tileSize)

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const cx = col * tileSize + tileSize / 2
      const cy = row * tileSize + tileSize / 2

      const brightness = sampleBrightness(
        cx, cy,
        config.brightnessMap, config.mapWidth, config.mapHeight,
        config.canvasWidth, config.canvasHeight
      )

      // Dark tiles fill most of their cell; bright tiles shrink to show grout lines
      const scale = 0.55 + 0.45 * (1 - brightness)
      const w = tileSize * scale
      const h = tileSize * scale

      rects.push({ x: cx - w / 2, y: cy - h / 2, w, h })
    }
  }

  return rects
}
