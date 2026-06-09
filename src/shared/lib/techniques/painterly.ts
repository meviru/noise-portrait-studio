import { seededRandom } from '@/shared/lib/utils/seededRandom'
import { clamp } from '@/shared/lib/utils/clamp'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { sampleBrightness, sobelGradient } from './imageUtils'
import type { StrokeItem } from '@/entities/stroke-data/StrokeData.types'

export interface PainterlyConfig {
  canvasWidth: number
  canvasHeight: number
  density: number      // grid columns → controls stroke coverage
  minSize: number      // min stroke weight
  maxSize: number      // max stroke weight
  strokeLength: number // max stroke length in px
  seed: number
}

export function generatePainterly(
  config: PainterlyConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): StrokeItem[] {
  const rand = seededRandom(config.seed)
  const { dx, dy } = sobelGradient(brightnessMap, mapWidth, mapHeight)
  const strokes: StrokeItem[] = []

  const spacing = config.canvasWidth / config.density
  const halfJitter = spacing * 0.45

  for (let y = spacing / 2; y < config.canvasHeight; y += spacing) {
    for (let x = spacing / 2; x < config.canvasWidth; x += spacing) {
      // Position jitter so strokes feel hand-placed, not grid-locked
      const jx = clamp(x + (rand() - 0.5) * 2 * halfJitter, 0, config.canvasWidth)
      const jy = clamp(y + (rand() - 0.5) * 2 * halfJitter, 0, config.canvasHeight)

      const brightness = sampleBrightness(
        jx, jy, brightnessMap, mapWidth, mapHeight,
        config.canvasWidth, config.canvasHeight
      )

      // Leave specular highlights unpainted — they read as bare canvas/paper
      if (brightness > 0.93) continue

      // Gradient at this sample position
      const mx = clamp(Math.round((jx / config.canvasWidth) * (mapWidth - 1)), 0, mapWidth - 1)
      const my = clamp(Math.round((jy / config.canvasHeight) * (mapHeight - 1)), 0, mapHeight - 1)
      const mi = my * mapWidth + mx
      const gx = dx[mi] ?? 0
      const gy = dy[mi] ?? 0
      const gradMag = Math.sqrt(gx * gx + gy * gy)

      // Stroke follows contour direction (perpendicular to gradient)
      // In flat areas use a slowly-varying random angle for painterly texture
      let angle: number
      if (gradMag < 0.05) {
        angle = rand() * Math.PI
      } else {
        angle = Math.atan2(gx, -gy)
      }
      // Small angle jitter breaks the mechanical regularity
      angle += (rand() - 0.5) * 0.5

      // Shorter strokes at strong edges (detail), longer in flat zones (broad sweep)
      const len = mapRange(clamp(gradMag, 0, 1), 0, 1, config.strokeLength, config.strokeLength * 0.25)

      // Thicker strokes in dark flat areas, fine precise strokes near edges
      const maxW = mapRange(clamp(gradMag, 0, 1), 0, 1, config.maxSize, config.minSize * 1.5)
      const weight = mapRange(1 - brightness, 0, 1, config.minSize, maxW)

      const half = len / 2
      strokes.push({
        x1: jx - Math.cos(angle) * half,
        y1: jy - Math.sin(angle) * half,
        x2: jx + Math.cos(angle) * half,
        y2: jy + Math.sin(angle) * half,
        weight,
      })
    }
  }

  return strokes
}
