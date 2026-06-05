import { PALETTES } from '@/shared/constants/canvas.constants'
import { useStudioStore, selectConfig } from '@/app/store'
import { PALETTE_LABELS, MONO_COLORS, COLOR_MODES } from './utility/constants/sidebar.constant'

/**
 * Lets the user switch between mono, photo, and palette color modes and pick a specific color or palette.
 */
export function PalettePicker() {
  const config = useStudioStore(selectConfig)
  const setConfig = useStudioStore((s) => s.setConfig)

  return (
    <div className="flex flex-col gap-3">
      {/* Color mode selector */}
      <div className="flex gap-1">
        {COLOR_MODES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setConfig({ colorMode: id })}
            className={[
              'flex-1 py-1 rounded text-[10px] font-medium tracking-wide transition-colors cursor-pointer',
              config.colorMode === id
                ? 'bg-primary-700 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {config.colorMode === 'mono' && (
        <div className="flex gap-2 flex-wrap">
          {MONO_COLORS.map(({ hex, label }) => (
            <button
              key={hex}
              title={label}
              aria-label={label}
              onClick={() => setConfig({ monoColor: hex })}
              className={[
                'w-6 h-6 rounded-full transition-all border-2 cursor-pointer',
                config.monoColor === hex
                  ? 'border-white scale-110'
                  : 'border-neutral-700 hover:scale-110',
              ].join(' ')}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      )}

      {config.colorMode === 'palette' && (
        <div className="flex gap-2 flex-wrap">
          {PALETTES.map((palette, i) => {
            const color = palette[0] ?? '#1a1a1a'
            const label = PALETTE_LABELS[i] ?? `Palette ${i}`
            return (
              <button
                key={i}
                title={label}
                aria-label={label}
                onClick={() => setConfig({ paletteIndex: i })}
                className={[
                  'w-6 h-6 rounded-full transition-all cursor-pointer',
                  config.paletteIndex === i
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900'
                    : 'hover:scale-110',
                ].join(' ')}
                style={{ backgroundColor: color }}
              />
            )
          })}
        </div>
      )}

      {config.colorMode === 'photo' && (
        <p className="text-[10px] text-neutral-500 leading-snug">
          Each element samples color directly from the uploaded photo.
        </p>
      )}
    </div>
  )
}
