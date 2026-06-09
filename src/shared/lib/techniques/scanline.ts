import { sampleBrightness, sobelGradient } from './imageUtils'
import { clamp } from '@/shared/lib/utils/clamp'
import type { StrokeItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for scanline generation. */
export interface ScanlineConfig {
  canvasWidth: number
  canvasHeight: number
  density: number
  strokeLength: number
  minSize: number
  scanlineAmplitude: number
}

/**
 * Generates horizontal scanlines whose vertical position is deflected by image brightness.
 * Dark pixels push lines upward; bright pixels leave them near the baseline,
 * producing a Joy Division-style waveform portrait.
 *
 * @param config - Scanline generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of short horizontal segments forming each scanline
 */
export function generateScanline(
  config: ScanlineConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): StrokeItem[] {
  const strokes: StrokeItem[] = []
  const numLines = config.density
  const lineSpacing = config.canvasHeight / numLines
  // Segment width controls horizontal resolution; smaller = smoother wave
  const segW = Math.max(2, config.strokeLength)

  const { dx, dy } = sobelGradient(brightnessMap, mapWidth, mapHeight)

  for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
    const baseY = (lineIdx + 0.5) * lineSpacing

    for (let x = 0; x < config.canvasWidth; x += segW) {
      const x1 = x
      const x2 = Math.min(x + segW, config.canvasWidth)

      const b1 = sampleBrightness(x1, baseY, brightnessMap, mapWidth, mapHeight, config.canvasWidth, config.canvasHeight)
      const b2 = sampleBrightness(x2, baseY, brightnessMap, mapWidth, mapHeight, config.canvasWidth, config.canvasHeight)

      // Sample edge strength at segment midpoint to boost deflection near facial features
      const mx = clamp(Math.round(((x1 + x2) / 2 / config.canvasWidth) * (mapWidth - 1)), 0, mapWidth - 1)
      const my = clamp(Math.round((baseY / config.canvasHeight) * (mapHeight - 1)), 0, mapHeight - 1)
      const mi = my * mapWidth + mx
      const edgeStrength = Math.min(1, Math.sqrt((dx[mi] ?? 0) ** 2 + (dy[mi] ?? 0) ** 2) * 3)
      // Strong edges (jaw, eyes, lips) get extra deflection so features read clearly
      const localAmplitude = config.scanlineAmplitude * (1 + edgeStrength * 0.5)

      // Dark pixels deflect lines upward; bright pixels stay near the baseline
      const y1 = baseY - (1 - b1) * localAmplitude
      const y2 = baseY - (1 - b2) * localAmplitude

      strokes.push({ x1, y1, x2, y2, weight: config.minSize })
    }
  }

  return strokes
}
