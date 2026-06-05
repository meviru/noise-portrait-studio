import type { RenderConfig } from './NoiseConfig.types'
import { TechniqueId, ColorMode } from './utility/constants/noise-config.constant'

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  technique: TechniqueId.Stipple,
  density: 2000,
  minSize: 1.0,
  maxSize: 5.0,
  opacity: 0.9,
  colorMode: ColorMode.Mono,
  monoColor: '#1a1a1a',
  paletteIndex: 0,
  strokeLength: 22,
  contourLevels: 8,
  crosshatchLayers: 2,
  seed: 4217,
}

// Legacy alias
export const DEFAULT_NOISE_CONFIG = DEFAULT_RENDER_CONFIG
