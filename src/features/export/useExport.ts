import { useState, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import { useStudioStore, selectRenderState } from '@/app/store'
import { exportSVG } from './exportSVG'
import { exportPNG } from './exportPNG'
import { exportPDF } from './exportPDF'
import type { Canvas } from 'fabric'
import type { ExportFormat } from '@/entities/export-options/ExportOptions.types'

interface UseExportReturn {
  exportCanvas: (format: ExportFormat, canvasRef: MutableRefObject<Canvas | null>) => Promise<void>
  isExporting: boolean
  exportError: string | null
  clearExportError: () => void
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const renderState = useStudioStore(selectRenderState)

  const exportCanvas = useCallback(
    async (format: ExportFormat, canvasRef: MutableRefObject<Canvas | null>) => {
      if (renderState !== 'done') return
      if (!canvasRef.current) return

      setIsExporting(true)
      setExportError(null)

      const result =
        format === 'svg'
          ? exportSVG(canvasRef.current)
          : format === 'png'
            ? exportPNG(canvasRef.current)
            : await exportPDF(canvasRef.current)

      if (!result.ok) {
        setExportError(result.error)
      }

      setIsExporting(false)
    },
    [renderState]
  )

  const clearExportError = useCallback(() => setExportError(null), [])

  return { exportCanvas, isExporting, exportError, clearExportError }
}
