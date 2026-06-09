import { seededRandom } from '@/shared/lib/utils/seededRandom'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { poissonDisk } from '@/shared/lib/utils/poissonDisk'
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
 * Generates stipple dots using Bridson's Poisson-disk sampling for even spatial
 * coverage, then applies a brightness-weighted acceptance pass. The Poisson-disk
 * eliminates the cold-spot gaps that rejection-only sampling produces in uniform
 * or lightly-toned areas.
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

  // minDist sized so the disk fills ~3× density candidates before the
  // brightness filter reduces the set to roughly the target density.
  const minDist = Math.sqrt(
    (config.canvasWidth * config.canvasHeight) / (config.density * 3)
  )

  const candidates = poissonDisk(
    config.canvasWidth,
    config.canvasHeight,
    minDist,
    config.density * 4,
    rand
  )

  const dots: DotItem[] = []
  for (const { x, y } of candidates) {
    if (dots.length >= config.density) break
    const brightness = sampleBrightness(
      x, y, brightnessMap, mapWidth, mapHeight,
      config.canvasWidth, config.canvasHeight
    )
    // Accept with probability proportional to darkness
    if (rand() > brightness) {
      const r = mapRange(1 - brightness, 0, 1, config.minSize, config.maxSize)
      dots.push({ x, y, r })
    }
  }

  return dots
}
