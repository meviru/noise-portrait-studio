import { seededRandom } from '@/shared/lib/utils/seededRandom'
import { clamp } from '@/shared/lib/utils/clamp'
import { sampleBrightness, sobelGradient } from './imageUtils'
import type { GeneratedPath } from '@/entities/stroke-data/StrokeData.types'

export interface FlowStrandsConfig {
  canvasWidth: number
  canvasHeight: number
  density: number        // number of strands
  strandLength: number   // max integration steps per direction
  minSize: number        // min stroke weight (used by renderer)
  maxSize: number        // max stroke weight (used by renderer)
  seed: number
}

const STEP_SIZE = 3 // canvas-px per integration step

export function generateFlowStrands(
  config: FlowStrandsConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): GeneratedPath[] {
  const rand = seededRandom(config.seed)
  const { dx, dy } = sobelGradient(brightnessMap, mapWidth, mapHeight)
  const paths: GeneratedPath[] = []
  const maxAttempts = config.density * 15

  function tangentAt(x: number, y: number): { tx: number; ty: number; valid: boolean } {
    const mx = clamp(Math.round((x / config.canvasWidth) * (mapWidth - 1)), 0, mapWidth - 1)
    const my = clamp(Math.round((y / config.canvasHeight) * (mapHeight - 1)), 0, mapHeight - 1)
    const mi = my * mapWidth + mx
    const gx = dx[mi] ?? 0
    const gy = dy[mi] ?? 0
    const mag = Math.sqrt(gx * gx + gy * gy)
    if (mag < 0.01) return { tx: 0, ty: 0, valid: false }
    // Tangent = perpendicular to gradient → strands flow along iso-brightness contours
    return { tx: -gy / mag, ty: gx / mag, valid: true }
  }

  function inBounds(x: number, y: number): boolean {
    return x >= 0 && x <= config.canvasWidth && y >= 0 && y <= config.canvasHeight
  }

  for (let attempts = 0; paths.length < config.density && attempts < maxAttempts; attempts++) {
    const sx = rand() * config.canvasWidth
    const sy = rand() * config.canvasHeight

    const brightness = sampleBrightness(
      sx, sy, brightnessMap, mapWidth, mapHeight,
      config.canvasWidth, config.canvasHeight
    )

    // Seed only from mid-to-dark areas; skip near-white highlights
    if (rand() > 1 - brightness * 0.85) continue

    // Walk backward (−tangent)
    const backward: GeneratedPath = []
    let x = sx
    let y = sy
    for (let step = 0; step < config.strandLength; step++) {
      const { tx, ty, valid } = tangentAt(x, y)
      if (!valid) break
      x -= tx * STEP_SIZE
      y -= ty * STEP_SIZE
      if (!inBounds(x, y)) break
      backward.unshift({ x, y })
    }

    // Walk forward (+tangent)
    const forward: GeneratedPath = []
    x = sx
    y = sy
    for (let step = 0; step < config.strandLength; step++) {
      const { tx, ty, valid } = tangentAt(x, y)
      if (!valid) break
      x += tx * STEP_SIZE
      y += ty * STEP_SIZE
      if (!inBounds(x, y)) break
      forward.push({ x, y })
    }

    const points: GeneratedPath = [...backward, { x: sx, y: sy }, ...forward]
    if (points.length >= 3) paths.push(points)
  }

  return paths
}
