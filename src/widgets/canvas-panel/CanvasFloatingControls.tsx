import { selectConfig, selectRenderState, useStudioStore, RenderState } from '@/app/store'
import type { ExportFormat } from '@/entities/export-options/ExportOptions.types'
import { useExport } from '@/features/export/useExport'
import { STRINGS } from '@/shared/constants/strings'
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

interface CanvasFloatingControlsProps {
  onGenerate: () => void
  onCancel: () => void
  onFit: () => void
  zoomPct: number
  canvasRef: MutableRefObject<Canvas | null>
}

const iconBtn =
  'p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors cursor-pointer'
const labelBtn =
  'flex items-center gap-1 px-2 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors cursor-pointer text-[11px]'
const divider = 'w-px h-3.5 bg-neutral-700/70 mx-0.5'

/**
 * Absolutely-positioned controls overlaid on the canvas: branding (mobile only, top-left)
 * and a frosted-glass pill bar (top-right) containing zoom, fit, seed, export, and generate actions.
 */
export function CanvasFloatingControls({
  onGenerate,
  onCancel,
  onFit,
  zoomPct,
  canvasRef,
}: CanvasFloatingControlsProps) {
  const renderState = useStudioStore(selectRenderState)
  const config = useStudioStore(selectConfig)
  const hasImage = useStudioStore((s) => s.brightnessMap !== null)
  const { exportCanvas, isExporting, exportError, clearExportError } = useExport()

  const [isExportOpen, setIsExportOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const canExport = renderState === RenderState.Done
  const isComputing = renderState === RenderState.Computing || renderState === RenderState.Rendering

  /**
   * Closes the export dropdown when the user clicks outside the dropdown container.
   * The listener is only attached while the dropdown is open.
   */
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
   * Closes the dropdown and delegates the actual export to `useExport`.
   * @param fmt - The target format: `svg`, `png`, or `pdf`.
   */
  const handleExport = useCallback(
    (fmt: ExportFormat) => {
      setIsExportOpen(false)
      exportCanvas(fmt, canvasRef)
    },
    [exportCanvas, canvasRef]
  )

  return (
    <>
      {/* Top-left: branding — mobile only (desktop shows it in the sidebar) */}
      <div className="sm:hidden absolute top-3 left-5 z-10 pointer-events-none select-none">
        <span className="text-[10px] tracking-widest uppercase font-semibold text-neutral-700">
          Noise Portrait Studio
        </span>
      </div>

      {/* Top-right: floating controls bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-0.5 bg-neutral-950/90 backdrop-blur-md border border-white/[0.07] rounded-xl shadow-lg px-1.5 py-1">
        {/* Zoom */}
        <span className="hidden sm:inline text-[11px] text-neutral-500 tabular-nums px-1.5 select-none">
          {zoomPct}%
        </span>

        {/* Fit */}
        <button onClick={onFit} className={iconBtn} aria-label="Fit canvas to screen">
          <IconRefresh size={13} aria-hidden="true" />
        </button>

        <div className={`${divider} hidden sm:block`} />

        {/* Seed */}
        <span className="hidden sm:inline text-[11px] text-neutral-500 px-1.5 select-none">
          seed: {config.seed}
        </span>

        <div className={`${divider} hidden sm:block`} />

        {/* Export dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            disabled={!canExport || isExporting}
            onClick={() => setIsExportOpen((o) => !o)}
            className={`${labelBtn} disabled:opacity-30 disabled:cursor-not-allowed`}
            aria-label="Export options"
          >
            <IconDownload size={13} aria-hidden="true" />
            <span className="hidden sm:inline">
              {isExporting ? STRINGS.export.exporting : 'Export'}
            </span>
            <span className="hidden sm:inline">
              {isExportOpen ? (
                <IconChevronUp size={11} className="opacity-60" aria-hidden="true" />
              ) : (
                <IconChevronDown size={11} className="opacity-60" aria-hidden="true" />
              )}
            </span>
          </button>

          {isExportOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl z-50 overflow-hidden">
              {(['svg', 'png', 'pdf'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors cursor-pointer"
                >
                  {STRINGS.export[fmt]}
                </button>
              ))}
              {exportError && (
                <div className="border-t border-neutral-800 px-3 py-2">
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

        <div className={divider} />

        {/* Generate / Cancel */}
        {isComputing ? (
          <button onClick={onCancel} className={labelBtn}>
            <IconX size={13} aria-hidden="true" />
            <span>{STRINGS.generate.cancel}</span>
          </button>
        ) : (
          <button
            onClick={onGenerate}
            disabled={!hasImage}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-primary-400 hover:text-primary-300 hover:bg-primary-950/50 transition-colors cursor-pointer text-[11px] font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {renderState === RenderState.Done ? (
              <IconRefresh size={13} aria-hidden="true" />
            ) : (
              <IconSparkles size={13} aria-hidden="true" />
            )}
            <span>
              {renderState === RenderState.Done ? STRINGS.generate.rerender : STRINGS.generate.button}
            </span>
          </button>
        )}
      </div>
    </>
  )
}
