import { clamp } from '@/shared/lib/utils/clamp'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { sobelGradient, sampleBrightness } from './imageUtils'
import type { StrokeItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for hatch stroke generation. */
export interface HatchConfig {
  canvasWidth: number
  canvasHeight: number
  density: number
  strokeLength: number
  minSize: number
  maxSize: number
}

// Internal: runs one hatch pass with a given angle offset and brightness ceiling
function hatchPass(
  config: HatchConfig,
  brightnessMap: Float32Array,
  dx: Float32Array,
  dy: Float32Array,
  mapWidth: number,
  mapHeight: number,
  angleOffset: number,
  brightnessThreshold: number
): StrokeItem[] {
  const strokes: StrokeItem[] = []
  const gridStep = Math.max(4, Math.sqrt((config.canvasWidth * config.canvasHeight) / config.density))

  for (let cy = gridStep / 2; cy < config.canvasHeight; cy += gridStep) {
    for (let cx = gridStep / 2; cx < config.canvasWidth; cx += gridStep) {
      const brightness = sampleBrightness(
        cx,
        cy,
        brightnessMap,
        mapWidth,
        mapHeight,
        config.canvasWidth,
        config.canvasHeight
      )

      if (brightness > brightnessThreshold) continue

      // Sample gradient at the map position
      const mx = Math.round((cx / config.canvasWidth) * (mapWidth - 1))
      const my = Math.round((cy / config.canvasHeight) * (mapHeight - 1))
      const mi = clamp(my, 0, mapHeight - 1) * mapWidth + clamp(mx, 0, mapWidth - 1)

      const gx = dx[mi] ?? 0
      const gy = dy[mi] ?? 0
      const mag = Math.sqrt(gx * gx + gy * gy)

      // Strokes run along edges (perpendicular to gradient)
      const baseAngle = mag < 0.01 ? 0 : Math.atan2(gy, gx) + Math.PI / 2
      const angle = baseAngle + angleOffset

      // Shorter strokes in bright areas, longer in dark
      const halfLen = (config.strokeLength / 2) * mapRange(1 - brightness, 0, 1, 0.4, 1.0)
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      strokes.push({
        x1: cx - cos * halfLen,
        y1: cy - sin * halfLen,
        x2: cx + cos * halfLen,
        y2: cy + sin * halfLen,
        weight: mapRange(1 - brightness, 0, 1, config.minSize, config.maxSize),
      })
    }
  }

  return strokes
}

/**
 * Generates hatching strokes aligned to image edges via a single Sobel pass.
 * Strokes are placed on a regular grid and oriented perpendicular to the local gradient;
 * flat areas default to horizontal strokes.
 *
 * @param config - Hatch generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of line segment endpoints and weights
 */
export function generateHatch(
  config: HatchConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): StrokeItem[] {
  const { dx, dy } = sobelGradient(brightnessMap, mapWidth, mapHeight)
  return hatchPass(config, brightnessMap, dx, dy, mapWidth, mapHeight, 0, 0.88)
}

/**
 * Runs one hatch pass with a pre-computed Sobel gradient.
 * Exported so crosshatch can compute the gradient once and reuse it across layers.
 *
 * @param config - Hatch generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param dx - Horizontal Sobel gradient from {@link sobelGradient}
 * @param dy - Vertical Sobel gradient from {@link sobelGradient}
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @param angleOffset - Rotation added to each stroke's base angle (radians)
 * @param brightnessThreshold - Cells brighter than this value are skipped
 * @returns Array of line segment endpoints and weights
 */
export function hatchWithGradient(
  config: HatchConfig,
  brightnessMap: Float32Array,
  dx: Float32Array,
  dy: Float32Array,
  mapWidth: number,
  mapHeight: number,
  angleOffset: number,
  brightnessThreshold: number
): StrokeItem[] {
  return hatchPass(config, brightnessMap, dx, dy, mapWidth, mapHeight, angleOffset, brightnessThreshold)
}
