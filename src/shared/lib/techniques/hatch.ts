import { clamp } from '@/shared/lib/utils/clamp'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { sobelGradient, sampleBrightness } from './imageUtils'
import type { StrokeItem } from '@/entities/stroke-data/StrokeData.types'

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

export function generateHatch(
  config: HatchConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): StrokeItem[] {
  const { dx, dy } = sobelGradient(brightnessMap, mapWidth, mapHeight)
  return hatchPass(config, brightnessMap, dx, dy, mapWidth, mapHeight, 0, 0.88)
}

// Exported for crosshatch to reuse gradient + inner pass
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
