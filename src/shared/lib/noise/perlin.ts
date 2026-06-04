import { createNoise2D } from 'simplex-noise'
import type { NoiseFunction2D } from 'simplex-noise'
import { seededRandom } from '@/shared/lib/utils/seededRandom'

export function createSeededNoise(seed: number): NoiseFunction2D {
  return createNoise2D(seededRandom(seed))
}

export function fbm(
  noise2D: NoiseFunction2D,
  x: number,
  y: number,
  octaves: number,
  scale: number
): number {
  let value = 0
  let amplitude = 1
  let frequency = scale
  let maxValue = 0

  for (let o = 0; o < octaves; o++) {
    value += noise2D(x * frequency, y * frequency) * amplitude
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2.0
  }

  return value / maxValue
}
