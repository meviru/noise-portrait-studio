import { seededRandom } from '@/shared/lib/utils/seededRandom'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { sampleBrightness } from './imageUtils'
import type { DotItem } from '@/entities/stroke-data/StrokeData.types'

export interface StippleConfig {
  canvasWidth: number
  canvasHeight: number
  density: number
  minSize: number
  maxSize: number
  seed: number
}

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
