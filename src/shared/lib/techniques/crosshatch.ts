import { sobelGradient } from './imageUtils'
import { hatchWithGradient } from './hatch'
import type { HatchConfig } from './hatch'
import type { StrokeItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for crosshatch stroke generation. Extends HatchConfig with a layer count. */
export interface CrosshatchConfig extends HatchConfig {
  layers: number // 2 or 3
}

// Layer brightness thresholds: each layer adds density to progressively darker areas
const LAYER_THRESHOLDS = [0.75, 0.45, 0.2]
// Layer angle offsets: 0°, 60°, 120°
const LAYER_ANGLES = [0, Math.PI / 3, (Math.PI * 2) / 3]

/**
 * Generates multi-layer crosshatched strokes at evenly spaced angles (0°, 60°, 120°).
 * Each layer uses a progressively lower brightness threshold so darker areas
 * accumulate more layers. The Sobel gradient is computed once and shared across layers.
 *
 * @param config - Crosshatch generation parameters including layer count (2 or 3)
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Combined array of stroke segments from all layers
 */
export function generateCrosshatch(
  config: CrosshatchConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): StrokeItem[] {
  // Compute gradient once, reuse across all layers
  const { dx, dy } = sobelGradient(brightnessMap, mapWidth, mapHeight)

  // Scale density per layer so total is roughly config.density
  const layerConfig: HatchConfig = {
    ...config,
    density: Math.round(config.density / config.layers),
  }

  const strokes: StrokeItem[] = []
  for (let i = 0; i < config.layers; i++) {
    const angle = LAYER_ANGLES[i] ?? 0
    const threshold = LAYER_THRESHOLDS[i] ?? 0.2
    const layer = hatchWithGradient(
      layerConfig,
      brightnessMap,
      dx,
      dy,
      mapWidth,
      mapHeight,
      angle,
      threshold
    )
    strokes.push(...layer)
  }

  return strokes
}
