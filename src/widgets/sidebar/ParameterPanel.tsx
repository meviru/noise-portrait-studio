import { IconDice5 } from '@tabler/icons-react'
import { Slider } from '@/shared/ui/Slider'
import { Button } from '@/shared/ui/Button'
import { useStudioStore, selectConfig } from '@/app/store'
import { TechniqueId } from '@/shared/constants/shared.constant'
import { STRINGS } from '@/shared/constants/strings'

/**
 * Renders technique-aware sliders and controls for density, size, opacity, stroke, and seed.
 */
export function ParameterPanel() {
  const config = useStudioStore(selectConfig)
  const setConfig = useStudioStore((s) => s.setConfig)
  const { technique } = config

  const isScanline = technique === TechniqueId.Scanline
  const isFlowStrands = technique === TechniqueId.FlowStrands
  const isDotTechnique = technique === TechniqueId.Stipple || technique === TechniqueId.Halftone

  const showStrokeLength = technique === TechniqueId.Hatch || technique === TechniqueId.Crosshatch || isScanline
  const showContourLevels = technique === TechniqueId.Contour
  const showCrosshatchLayers = technique === TechniqueId.Crosshatch
  const showDensity = technique !== TechniqueId.Contour
  const showMaxSize = technique !== TechniqueId.Contour && !isScanline
  const showScanlineAmplitude = isScanline
  const showStrandLength = isFlowStrands
  const showSeed = technique === TechniqueId.Stipple || isFlowStrands

  const densityLabel = isScanline ? 'Lines' : isFlowStrands ? 'Strands' : 'Density'
  const densityMin = isScanline ? 20 : isFlowStrands ? 100 : 300
  const densityMax = isScanline ? 200 : isFlowStrands ? 1000 : 4000
  const densityStep = isScanline ? 5 : isFlowStrands ? 25 : 100

  return (
    <div className="flex flex-col gap-3">
      {showDensity && (
        <Slider
          label={densityLabel}
          min={densityMin}
          max={densityMax}
          step={densityStep}
          value={config.density}
          onChange={(v) => setConfig({ density: v })}
        />
      )}

      <Slider
        label={isDotTechnique ? 'Min Dot Size' : isScanline ? 'Line Weight' : 'Min Weight'}
        min={0.3}
        max={3.0}
        step={0.1}
        value={config.minSize}
        onChange={(v) => setConfig({ minSize: v })}
        formatValue={(v) => v.toFixed(1)}
      />

      {showMaxSize && (
        <Slider
          label={isDotTechnique ? 'Max Dot Size' : 'Max Weight'}
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
          label={isScanline ? 'Resolution' : 'Stroke Length'}
          min={isScanline ? 2 : 6}
          max={isScanline ? 20 : 60}
          step={isScanline ? 1 : 2}
          value={config.strokeLength}
          onChange={(v) => setConfig({ strokeLength: v })}
          formatValue={(v) => `${v}px`}
        />
      )}

      {showScanlineAmplitude && (
        <Slider
          label="Amplitude"
          min={5}
          max={60}
          step={1}
          value={config.scanlineAmplitude}
          onChange={(v) => setConfig({ scanlineAmplitude: v })}
          formatValue={(v) => `${v}px`}
        />
      )}

      {showStrandLength && (
        <Slider
          label="Strand Length"
          min={20}
          max={150}
          step={10}
          value={config.strandLength}
          onChange={(v) => setConfig({ strandLength: v })}
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
                  'flex-1 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
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
