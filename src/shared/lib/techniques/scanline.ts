import { sampleBrightness } from './imageUtils'
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

  for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
    const baseY = (lineIdx + 0.5) * lineSpacing

    for (let x = 0; x < config.canvasWidth; x += segW) {
      const x1 = x
      const x2 = Math.min(x + segW, config.canvasWidth)

      const b1 = sampleBrightness(x1, baseY, brightnessMap, mapWidth, mapHeight, config.canvasWidth, config.canvasHeight)
      const b2 = sampleBrightness(x2, baseY, brightnessMap, mapWidth, mapHeight, config.canvasWidth, config.canvasHeight)

      // Dark pixels deflect lines upward; bright pixels stay near the baseline
      const y1 = baseY - (1 - b1) * config.scanlineAmplitude
      const y2 = baseY - (1 - b2) * config.scanlineAmplitude

      strokes.push({ x1, y1, x2, y2, weight: config.minSize })
    }
  }

  return strokes
}
