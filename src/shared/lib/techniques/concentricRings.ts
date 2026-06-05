import { mapRange } from '@/shared/lib/utils/mapRange'
import { sampleBrightness } from './imageUtils'
import type { StrokeItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for concentric ring generation. */
export interface ConcentricRingsConfig {
  canvasWidth: number
  canvasHeight: number
  density: number   // number of rings
  minSize: number   // stroke weight at brightest areas
  maxSize: number   // stroke weight at darkest areas
}

/**
 * Generates concentric arcs approximated as short line segments, radiating from
 * the canvas centre. Each segment's stroke weight is mapped from local brightness,
 * making arcs thick in shadows and thin-to-invisible in highlights.
 *
 * @param config - Concentric rings generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of arc segments; near-invisible segments (weight < 0.15) are omitted
 */
export function generateConcentricRings(
  config: ConcentricRingsConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): StrokeItem[] {
  const strokes: StrokeItem[] = []
  const cx = config.canvasWidth / 2
  const cy = config.canvasHeight / 2
  // Extend to corners so rings cover the full canvas
  const maxRadius = Math.sqrt(cx * cx + cy * cy) * 1.05
  const ringSpacing = maxRadius / config.density

  for (let ring = 1; ring <= config.density; ring++) {
    const r = ring * ringSpacing

    // Angular step sized to produce ~3px chords — smoothly curved arcs
    const dTheta = Math.max(0.004, 3 / r)
    const steps = Math.ceil((2 * Math.PI) / dTheta)
    const exactStep = (2 * Math.PI) / steps

    let prevX = cx + r * Math.cos(0)
    let prevY = cy + r * Math.sin(0)

    for (let s = 1; s <= steps; s++) {
      const theta = s * exactStep
      const x = cx + r * Math.cos(theta)
      const y = cy + r * Math.sin(theta)

      // Sample at the midpoint of this segment for a stable weight
      const midX = (prevX + x) / 2
      const midY = (prevY + y) / 2
      const brightness = sampleBrightness(
        midX, midY,
        brightnessMap, mapWidth, mapHeight,
        config.canvasWidth, config.canvasHeight
      )

      const weight = mapRange(1 - brightness, 0, 1, config.minSize, config.maxSize)

      // Skip near-invisible segments to keep object count low
      if (weight >= 0.15) {
        strokes.push({ x1: prevX, y1: prevY, x2: x, y2: y, weight })
      }

      prevX = x
      prevY = y
    }
  }

  return strokes
}
