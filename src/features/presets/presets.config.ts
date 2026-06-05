import type { RenderConfig } from '@/entities/noise-config/NoiseConfig.types'
import { TechniqueId } from '@/entities/noise-config/utility/constants/noise-config.constant'
import { DEFAULT_RENDER_CONFIG } from '@/entities/noise-config/NoiseConfig.defaults'

export interface Preset {
  id: TechniqueId
  label: string
  description: string
  overrides: Partial<Omit<RenderConfig, 'colorMode' | 'monoColor' | 'paletteIndex'>>
}

export const PRESETS: Preset[] = [
  {
    id: TechniqueId.Stipple,
    label: 'Stipple',
    description: 'Dot cloud - dense in shadows, sparse in highlights',
    overrides: {
      technique: TechniqueId.Stipple,
      density: 2000,
      minSize: 1.0,
      maxSize: 5.0,
      opacity: 0.9,
      seed: 4217,
    },
  },
  {
    id: TechniqueId.Hatch,
    label: 'Hatching',
    description: 'Short strokes following contours - pencil sketch look',
    overrides: {
      technique: TechniqueId.Hatch,
      density: 1500,
      minSize: 0.6,
      maxSize: 2.2,
      opacity: 0.85,
      strokeLength: 22,
    },
  },
  {
    id: TechniqueId.Contour,
    label: 'Contour',
    description: 'Iso-brightness curves - topographic map of the face',
    overrides: {
      technique: TechniqueId.Contour,
      contourLevels: 8,
      minSize: 1.0,
      maxSize: 1.0,
      opacity: 0.9,
    },
  },
  {
    id: TechniqueId.Crosshatch,
    label: 'Crosshatch',
    description: 'Layered strokes at multiple angles - engraving style',
    overrides: {
      technique: TechniqueId.Crosshatch,
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
