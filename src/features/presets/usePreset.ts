import { useCallback } from 'react'
import { useStudioStore, selectConfig, selectActivePreset } from '@/app/store'
import { applyPreset } from './presets.config'
import type { TechniqueId } from '@/entities/noise-config/NoiseConfig.types'

/**
 * Returns the active preset id and a stable callback to apply a new preset.
 * @returns Object with `activePreset` and `activatePreset`.
 */
export function usePreset() {
  const config = useStudioStore(selectConfig)
  const activePreset = useStudioStore(selectActivePreset)
  const setConfig = useStudioStore((s) => s.setConfig)
  const setPreset = useStudioStore((s) => s.setPreset)

  /**
   * Applies the preset's config delta and updates the active preset id in the store.
   * @param id - The technique id of the preset to activate.
   */
  const activatePreset = useCallback(
    (id: TechniqueId) => {
      const next = applyPreset(config, id)
      setPreset(id)
      setConfig(next)
    },
    [config, setConfig, setPreset]
  )

  return { activePreset, activatePreset }
}
