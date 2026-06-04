import type { TechniqueId, RenderConfig } from '@/entities/noise-config/NoiseConfig.types'
import { DEFAULT_RENDER_CONFIG } from '@/entities/noise-config/NoiseConfig.defaults'

export interface Preset {
  id: TechniqueId
  label: string
  description: string
  overrides: Partial<Omit<RenderConfig, 'colorMode' | 'monoColor' | 'paletteIndex'>>
}

export const PRESETS: Preset[] = [
  {
    id: 'stipple',
    label: 'Stipple',
    description: 'Dot cloud — dense in shadows, sparse in highlights',
    overrides: {
      technique: 'stipple',
      density: 2000,
      minSize: 1.0,
      maxSize: 5.0,
      opacity: 0.9,
      seed: 4217,
    },
  },
  {
    id: 'hatch',
    label: 'Hatching',
    description: 'Short strokes following contours — pencil sketch look',
    overrides: {
      technique: 'hatch',
      density: 1500,
      minSize: 0.6,
      maxSize: 2.2,
      opacity: 0.85,
      strokeLength: 22,
    },
  },
  {
    id: 'contour',
    label: 'Contour',
    description: 'Iso-brightness curves — topographic map of the face',
    overrides: {
      technique: 'contour',
      contourLevels: 8,
      minSize: 1.0,
      maxSize: 1.0,
      opacity: 0.9,
    },
  },
  {
    id: 'crosshatch',
    label: 'Crosshatch',
    description: 'Layered strokes at multiple angles — engraving style',
    overrides: {
      technique: 'crosshatch',
      density: 2000,
      minSize: 0.5,
      maxSize: 1.8,
      opacity: 0.8,
      strokeLength: 20,
      crosshatchLayers: 3,
    },
  },
]

export function applyPreset(base: RenderConfig, presetId: TechniqueId): RenderConfig {
  const preset = PRESETS.find((p) => p.id === presetId)
  if (!preset) return base
  return {
    ...DEFAULT_RENDER_CONFIG,
    ...preset.overrides,
    // Always preserve user's colour settings and seed
    colorMode: base.colorMode,
    monoColor: base.monoColor,
    paletteIndex: base.paletteIndex,
    seed: base.seed,
  }
}
