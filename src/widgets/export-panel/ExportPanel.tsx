import type { MutableRefObject } from 'react'
import type { Canvas } from 'fabric'
import { Button } from '@/shared/ui/Button'
import { useStudioStore, selectRenderState, RenderState } from '@/app/store'
import { useExport } from '@/features/export/useExport'
import { STRINGS } from '@/shared/constants/strings'
import type { ExportFormat } from '@/entities/export-options/ExportOptions.types'

interface ExportPanelProps {
  canvasRef: MutableRefObject<Canvas | null>
}

export function ExportPanel({ canvasRef }: ExportPanelProps) {
  const renderState = useStudioStore(selectRenderState)
  const canExport = renderState === RenderState.Done
  const { exportCanvas, isExporting, exportError, clearExportError } = useExport()

  return (
    <div className="flex flex-col gap-1 shrink-0">
      <div className="flex gap-2 p-3 border-t border-neutral-800">
        {(['svg', 'png', 'pdf'] as ExportFormat[]).map((fmt) => (
          <Button
            key={fmt}
            disabled={!canExport || isExporting}
            variant="ghost"
            size="sm"
            onClick={() => exportCanvas(fmt, canvasRef)}
          >
            {isExporting ? STRINGS.export.exporting : STRINGS.export[fmt]}
          </Button>
        ))}
      </div>
      {exportError && (
        <div className="px-3 pb-2 flex items-center gap-2">
          <p role="alert" className="text-[10px] text-red-400 flex-1">
            {exportError}
          </p>
          <button
            onClick={clearExportError}
            className="text-[10px] text-neutral-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
