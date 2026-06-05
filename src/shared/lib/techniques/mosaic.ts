import type { RectItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for mosaic tile generation. */
export interface MosaicConfig {
  canvasWidth: number
  canvasHeight: number
  density: number // tiles per row
}

/**
 * Generates a uniform grid of tiles that covers the entire canvas.
 * Tile colour is sampled from the image at render time by the Fabric renderer.
 *
 * @param config - Mosaic generation parameters
 * @returns Array of tile rectangles in row-major order
 */
export function generateMosaic(
  config: MosaicConfig,
): RectItem[] {
  const rects: RectItem[] = []
  const tileSize = config.canvasWidth / config.density
  const numCols = config.density
  const numRows = Math.ceil(config.canvasHeight / tileSize)

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const x = col * tileSize
      const y = row * tileSize
      rects.push({
        x,
        y,
        w: Math.min(tileSize, config.canvasWidth - x),
        h: Math.min(tileSize, config.canvasHeight - y),
      })
    }
  }

  return rects
}
