import { selectConfig, selectRenderState, useStudioStore, RenderState } from '@/app/store'
import type { ExportFormat } from '@/entities/export-options/ExportOptions.types'
import { useExport } from '@/features/export/useExport'
import { STRINGS } from '@/shared/constants/strings'
import { Button } from '@/shared/ui/Button'
import {
  IconChevronDown,
  IconChevronUp,
  IconDownload,
  IconRefresh,
  IconSparkles,
  IconX,
} from '@tabler/icons-react'
import type { Canvas } from 'fabric'
import type { MutableRefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface CanvasToolbarProps {
  onGenerate: () => void
  onCancel: () => void
  onFit: () => void
  zoomPct: number
  canvasRef: MutableRefObject<Canvas | null>
}

/**
 * Top toolbar with the app title, zoom readout, fit, export dropdown, and generate/cancel button.
 */
export function CanvasToolbar({
  onGenerate,
  onCancel,
  onFit,
  zoomPct,
  canvasRef,
}: CanvasToolbarProps) {
  const renderState = useStudioStore(selectRenderState)
  const config = useStudioStore(selectConfig)
  const hasImage = useStudioStore((s) => s.brightnessMap !== null)
  const { exportCanvas, isExporting, exportError, clearExportError } = useExport()

  const [isExportOpen, setIsExportOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /**
   * True when a completed render is available for export.
   */
  const canExport = renderState === RenderState.Done
  /**
   * True while the worker is still computing or rendering.
   */
  const isComputing = renderState === RenderState.Computing || renderState === RenderState.Rendering

  useEffect(() => {
    if (!isExportOpen) return
    function onOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsExportOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [isExportOpen])

  /**
   * Closes the export dropdown and triggers the export pipeline for the selected format.
   * @param fmt - The export format chosen from the dropdown.
   */
  const handleExport = useCallback(
    (fmt: ExportFormat) => {
      setIsExportOpen(false)
      exportCanvas(fmt, canvasRef)
    },
    [exportCanvas, canvasRef]
  )

  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-800 shrink-0 bg-neutral-950">
      {/* Left: logo + app name */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs tracking-widest uppercase font-semibold text-neutral-400">
          Noise Portrait Studio
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Zoom */}
        <span className="hidden sm:inline text-xs text-neutral-300 w-9 text-right tabular-nums mr-1 sm:mr-0">{zoomPct}%</span>

        <div className="w-px h-4 bg-neutral-800 hidden sm:block" />

        <Button size="sm" variant="ghost" onClick={onFit} ariaLabel="Fit canvas to screen">
          <IconRefresh size={14} aria-hidden="true" />
        </Button>

        <div className="w-px h-4 bg-neutral-800 hidden sm:block" />

        <span className="text-xs text-neutral-300 hidden sm:inline">seed: {config.seed}</span>

        <div className="w-px h-4 bg-neutral-800 hidden sm:block" />

        {/* Export dropdown */}
        <div className="relative mr-1 sm:mr-0" ref={dropdownRef}>
          <Button
            size="sm"
            variant="ghost"
            disabled={!canExport || isExporting}
            onClick={() => setIsExportOpen((o) => !o)}
            ariaLabel="Export options"
          >
            <IconDownload size={14} aria-hidden="true" />
            <span className="hidden sm:inline ml-1.5">
              {isExporting ? STRINGS.export.exporting : 'Export'}
            </span>
            <span className="hidden sm:inline">
              {isExportOpen ? (
                <IconChevronUp size={14} className="ml-1 mt-0.5 opacity-70" aria-hidden="true" />
              ) : (
                <IconChevronDown size={14} className="ml-1 mt-0.5 opacity-70" aria-hidden="true" />
              )}
            </span>
          </Button>

          {isExportOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-neutral-800 border border-neutral-700 rounded-md shadow-2xl z-50 overflow-hidden">
              {(['svg', 'png', 'pdf'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-neutral-200 hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  {STRINGS.export[fmt]}
                </button>
              ))}
              {exportError && (
                <div className="border-t border-neutral-700 px-3 py-2">
                  <p role="alert" className="text-[10px] text-red-400 leading-snug mb-1">
                    {exportError}
                  </p>
                  <button
                    onClick={clearExportError}
                    className="text-[10px] text-neutral-600 underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-neutral-800 hidden sm:block" />

        {/* Generate / Cancel */}
        {isComputing ? (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <IconX size={14} aria-hidden="true" />
            <span className="ml-1.5">{STRINGS.generate.cancel}</span>
          </Button>
        ) : (
          <Button size="sm" onClick={onGenerate} disabled={!hasImage}>
            {renderState === RenderState.Done ? (
              <IconRefresh size={14} aria-hidden="true" />
            ) : (
              <IconSparkles size={14} aria-hidden="true" />
            )}
            <span className="ml-1.5">
              {renderState === RenderState.Done ? STRINGS.generate.rerender : STRINGS.generate.button}
            </span>
          </Button>
        )}
      </div>
    </div>
  )
}
