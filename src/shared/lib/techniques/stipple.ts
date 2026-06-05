import { seededRandom } from '@/shared/lib/utils/seededRandom'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { sampleBrightness } from './imageUtils'
import type { DotItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for stipple dot generation. */
export interface StippleConfig {
  canvasWidth: number
  canvasHeight: number
  density: number
  minSize: number
  maxSize: number
  seed: number
}

/**
 * Generates stipple dots using rejection sampling weighted by pixel darkness.
 * Darker areas attract more and larger dots; bright highlights receive few or none.
 *
 * @param config - Stipple generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of dot positions and radii
 */
export function generateStipple(
  config: StippleConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): DotItem[] {
  const rand = seededRandom(config.seed)
  const dots: DotItem[] = []
  const maxAttempts = config.density * 15

  let attempts = 0
  while (dots.length < config.density && attempts < maxAttempts) {
    attempts++
    const x = rand() * config.canvasWidth
    const y = rand() * config.canvasHeight

    const brightness = sampleBrightness(
      x,
      y,
      brightnessMap,
      mapWidth,
      mapHeight,
      config.canvasWidth,
      config.canvasHeight
    )

    // Accept with probability proportional to darkness
    if (rand() > brightness) {
      const r = mapRange(1 - brightness, 0, 1, config.minSize, config.maxSize)
      dots.push({ x, y, r })
    }
  }

  return dots
}
