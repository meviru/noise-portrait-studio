import { DEFAULT_RENDER_CONFIG, PRESETS, TechniqueId } from '@/shared/constants/shared.constant'
import type { RenderConfig } from '@/shared/constants/shared.constant'

/**
 * Merges a preset's overrides onto the baseline config, preserving the user's colour and seed settings.
 * @param base - The current render config to base the result on.
 * @param presetId - The technique preset to apply.
 * @returns A new RenderConfig with preset overrides applied.
 */
export function applyPreset(base: RenderConfig, presetId: TechniqueId): RenderConfig {
  const preset = PRESETS.find((p) => p.id === presetId)
  if (!preset) return base
  return {
    ...DEFAULT_RENDER_CONFIG,
    ...preset.overrides,
    colorMode: base.colorMode,
    monoColor: base.monoColor,
    paletteIndex: base.paletteIndex,
    seed: base.seed,
  }
}
