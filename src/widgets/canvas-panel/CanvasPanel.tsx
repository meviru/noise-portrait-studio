import { useRef, useState, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import type { Canvas } from 'fabric'
import { useFabricCanvas } from '@/shared/lib/fabric/useFabricCanvas'
import { useGenerate } from '@/features/generate/useGenerate'
import { CanvasOverlay } from './CanvasOverlay'
import { CanvasToolbar } from './CanvasToolbar'

interface CanvasPanelProps {
  canvasRef: MutableRefObject<Canvas | null>
}

/**
 * Main canvas area; owns the Fabric.js canvas, zoom state, and wires generate/cancel actions.
 */
export function CanvasPanel({ canvasRef }: CanvasPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoomPct, setZoomPct] = useState(100)
  const { elementRef, fitCanvas } = useFabricCanvas(containerRef, canvasRef, setZoomPct)
  const { trigger, cancel } = useGenerate()

  /**
   * Stable callback that fires generation with the current canvas ref.
   */
  const handleGenerate = useCallback(() => trigger(canvasRef), [trigger, canvasRef])

  return (
    <div className="flex flex-col flex-1 bg-neutral-950 min-h-0">
      <CanvasToolbar
        onGenerate={handleGenerate}
        onCancel={cancel}
        onFit={fitCanvas}
        zoomPct={zoomPct}
        canvasRef={canvasRef}
      />
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <canvas ref={elementRef} role="img" aria-label="Generated noise portrait" />
        <CanvasOverlay />
      </div>
    </div>
  )
}
