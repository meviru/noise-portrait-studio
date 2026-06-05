import { useState, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import { useStudioStore, selectRenderState, RenderState } from '@/app/store'
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

/**
 * Handles SVG, PNG, and PDF export from the Fabric canvas with loading and error state.
 * @returns Object with `exportCanvas`, `isExporting`, `exportError`, and `clearExportError`.
 */
export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const renderState = useStudioStore(selectRenderState)

  /**
   * Runs the appropriate exporter for `format` and triggers a file download.
   * @param format - The target export format: `svg`, `png`, or `pdf`.
   * @param canvasRef - Ref to the Fabric canvas to export.
   */
  const exportCanvas = useCallback(
    async (format: ExportFormat, canvasRef: MutableRefObject<Canvas | null>) => {
      if (renderState !== RenderState.Done) return
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

  /**
   * Resets the export error to null.
   */
  const clearExportError = useCallback(() => setExportError(null), [])

  return { exportCanvas, isExporting, exportError, clearExportError }
}
