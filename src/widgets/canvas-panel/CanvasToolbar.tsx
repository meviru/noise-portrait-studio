import { Button } from '@/shared/ui/Button'
import { useStudioStore, selectRenderState, selectConfig } from '@/app/store'
import { STRINGS } from '@/shared/constants/strings'

interface CanvasToolbarProps {
  onGenerate: () => void
  onCancel: () => void
  onFit: () => void
  zoomPct: number
}

export function CanvasToolbar({ onGenerate, onCancel, onFit, zoomPct }: CanvasToolbarProps) {
  const renderState = useStudioStore(selectRenderState)
  const config = useStudioStore(selectConfig)
  const hasImage = useStudioStore((s) => s.brightnessMap !== null)

  const isComputing = renderState === 'computing' || renderState === 'rendering'

  return (
    <div className="flex items-center justify-between px-4 h-11 border-b border-neutral-800 shrink-0">
      <span className="text-[10px] tracking-widest uppercase font-medium text-neutral-500">
        noise portrait studio
      </span>

      <div className="flex items-center gap-2">
        {/* Zoom indicator + fit button */}
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-[10px] text-neutral-600 font-mono w-9 text-right tabular-nums">
            {zoomPct}%
          </span>
          <Button size="sm" variant="ghost" onClick={onFit} ariaLabel="Fit canvas to screen">
            ⊡
          </Button>
        </div>

        <div className="w-px h-4 bg-neutral-800 hidden sm:block" />

        <span className="text-[10px] text-neutral-600 font-mono hidden sm:inline">
          seed: {config.seed}
        </span>

        {isComputing ? (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {STRINGS.generate.cancel}
          </Button>
        ) : (
          <Button size="sm" onClick={onGenerate} disabled={!hasImage}>
            {renderState === 'done' ? STRINGS.generate.rerender : STRINGS.generate.button}
          </Button>
        )}
      </div>
    </div>
  )
}
