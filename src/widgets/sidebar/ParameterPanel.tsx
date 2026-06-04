import { IconDice5 } from '@tabler/icons-react'
import { Slider } from '@/shared/ui/Slider'
import { Button } from '@/shared/ui/Button'
import { useStudioStore, selectConfig } from '@/app/store'
import { STRINGS } from '@/shared/constants/strings'

export function ParameterPanel() {
  const config = useStudioStore(selectConfig)
  const setConfig = useStudioStore((s) => s.setConfig)
  const { technique } = config

  const showStrokeLength = technique === 'hatch' || technique === 'crosshatch'
  const showContourLevels = technique === 'contour'
  const showCrosshatchLayers = technique === 'crosshatch'
  const showDensity = technique !== 'contour'
  const showSeed = technique === 'stipple'

  return (
    <div className="flex flex-col gap-3">
      {showDensity && (
        <Slider
          label="Density"
          min={300}
          max={4000}
          step={100}
          value={config.density}
          onChange={(v) => setConfig({ density: v })}
        />
      )}

      <Slider
        label={technique === 'stipple' ? 'Min Dot Size' : 'Min Weight'}
        min={0.3}
        max={3.0}
        step={0.1}
        value={config.minSize}
        onChange={(v) => setConfig({ minSize: v })}
        formatValue={(v) => v.toFixed(1)}
      />

      {technique !== 'contour' && (
        <Slider
          label={technique === 'stipple' ? 'Max Dot Size' : 'Max Weight'}
          min={1.0}
          max={10.0}
          step={0.5}
          value={config.maxSize}
          onChange={(v) => setConfig({ maxSize: v })}
          formatValue={(v) => v.toFixed(1)}
        />
      )}

      <Slider
        label="Opacity"
        min={0.1}
        max={1.0}
        step={0.05}
        value={config.opacity}
        onChange={(v) => setConfig({ opacity: v })}
        formatValue={(v) => Math.round(v * 100) + '%'}
      />

      {showStrokeLength && (
        <Slider
          label="Stroke Length"
          min={6}
          max={60}
          step={2}
          value={config.strokeLength}
          onChange={(v) => setConfig({ strokeLength: v })}
          formatValue={(v) => `${v}px`}
        />
      )}

      {showContourLevels && (
        <Slider
          label="Contour Levels"
          min={4}
          max={12}
          step={1}
          value={config.contourLevels}
          onChange={(v) => setConfig({ contourLevels: v })}
        />
      )}

      {showCrosshatchLayers && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-400">Layers</span>
          <div className="flex gap-1.5">
            {[2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setConfig({ crosshatchLayers: n })}
                className={[
                  'flex-1 py-1 rounded text-xs font-medium transition-colors',
                  config.crosshatchLayers === n
                    ? 'bg-primary-700 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSeed && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-widest uppercase font-medium text-neutral-500">
            {STRINGS.sidebar.seed}
          </span>
          <div className="flex gap-1.5">
            <input
              type="number"
              value={config.seed}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) setConfig({ seed: v })
              }}
              className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:border-primary-600"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfig({ seed: Math.floor(Math.random() * 99999) })}
              ariaLabel="Randomise seed"
            >
              <IconDice5 size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
