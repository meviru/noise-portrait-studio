import { PRESETS } from '@/features/presets/presets.config'
import { usePreset } from '@/features/presets/usePreset'

export function PresetGrid() {
  const { activePreset, activatePreset } = usePreset()

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {PRESETS.map((preset) => {
        const isActive = preset.id === activePreset
        return (
          <button
            key={preset.id}
            onClick={() => activatePreset(preset.id)}
            className={[
              'flex flex-col gap-0.5 p-2 rounded text-left transition-colors',
              isActive
                ? 'bg-violet-950 border border-violet-600'
                : 'bg-neutral-800 border border-neutral-700 hover:border-neutral-600',
            ].join(' ')}
          >
            <span className="text-xs font-medium text-neutral-100 truncate">{preset.label}</span>
            <span className="text-[10px] text-neutral-500 leading-tight line-clamp-2">
              {preset.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
