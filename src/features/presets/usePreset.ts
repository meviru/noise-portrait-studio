import { useCallback } from 'react'
import { useStudioStore, selectConfig, selectActivePreset } from '@/app/store'
import { applyPreset } from './presets.config'
import type { TechniqueId } from '@/entities/noise-config/NoiseConfig.types'

export function usePreset() {
  const config = useStudioStore(selectConfig)
  const activePreset = useStudioStore(selectActivePreset)
  const setConfig = useStudioStore((s) => s.setConfig)
  const setPreset = useStudioStore((s) => s.setPreset)

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
