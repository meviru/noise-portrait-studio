import { createSeededNoise, fbm } from './perlin'
import { clamp } from '@/shared/lib/utils/clamp'
import type {
  FlowFieldConfig,
  GeneratedPath,
  PathPoint,
} from '@/entities/stroke-data/StrokeData.types'
import { seededRandom } from '@/shared/lib/utils/seededRandom'

function sampleBrightness(
  x: number,
  y: number,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number,
  canvasWidth: number,
  canvasHeight: number
): number {
  const mx = Math.round((x / canvasWidth) * (mapWidth - 1))
  const my = Math.round((y / canvasHeight) * (mapHeight - 1))
  const idx = clamp(my, 0, mapHeight - 1) * mapWidth + clamp(mx, 0, mapWidth - 1)
  return brightnessMap[idx] ?? 0.5
}

export function generateFlowPaths(
  config: FlowFieldConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): GeneratedPath[] {
  const { width, height, noiseScale, octaves, stepLength, stepCount, particleCount, seed } = config
  const noise2D = createSeededNoise(seed)
  const rand = seededRandom(seed + 1)
  const paths: GeneratedPath[] = []

  for (let i = 0; i < particleCount; i++) {
    let startX = 0
    let startY = 0
    let attempts = 0

    do {
      startX = rand() * width
      startY = rand() * height
      const brightness = sampleBrightness(
        startX,
        startY,
        brightnessMap,
        mapWidth,
        mapHeight,
        width,
        height
      )
      if (rand() > brightness || attempts > 10) break
      attempts++
      // eslint-disable-next-line no-constant-condition
    } while (true)

    const points: PathPoint[] = [{ x: startX, y: startY }]
    let x = startX
    let y = startY

    for (let step = 0; step < stepCount; step++) {
      const angle =
        fbm(noise2D, x / width, y / height, octaves, noiseScale / 0.001) * Math.PI * 2
      x += Math.cos(angle) * stepLength
      y += Math.sin(angle) * stepLength

      if (x < 0 || x > width || y < 0 || y > height) break
      points.push({ x, y })
    }

    if (points.length > 2) {
      paths.push(points)
    }
  }

  return paths
}
