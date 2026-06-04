import { useEffect, useRef, useCallback } from 'react'
import type { MutableRefObject, RefObject } from 'react'
import { Canvas, Point } from 'fabric'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/shared/constants/canvas.constants'

interface UseFabricCanvasReturn {
  canvasRef: MutableRefObject<Canvas | null>
  elementRef: MutableRefObject<HTMLCanvasElement | null>
  fitCanvas: () => void
}

export function useFabricCanvas(
  containerRef: RefObject<HTMLDivElement | null>,
  externalCanvasRef?: MutableRefObject<Canvas | null>,
  onZoomChange?: (pct: number) => void
): UseFabricCanvasReturn {
  const internalCanvasRef = useRef<Canvas | null>(null)
  const canvasRef = externalCanvasRef ?? internalCanvasRef
  const elementRef = useRef<HTMLCanvasElement | null>(null)
  const baseScaleRef = useRef(1)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return

    const scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT)
    baseScaleRef.current = scale

    const offsetX = (width - CANVAS_WIDTH * scale) / 2
    const offsetY = (height - CANVAS_HEIGHT * scale) / 2

    canvas.setDimensions({ width, height })
    canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY])
    onZoomChange?.(Math.round(scale * 100))
  }, [canvasRef, containerRef, onZoomChange])

  useEffect(() => {
    if (!elementRef.current) return

    const canvas = new Canvas(elementRef.current, {
      selection: false,
      renderOnAddRemove: false,
      enableRetinaScaling: true,
      backgroundColor: '#f5f5f5',
    })

    canvasRef.current = canvas

    // ── Fit to container on resize ────────────────────────────────────────────
    const observer = new ResizeObserver(() => {
      const container = containerRef.current
      if (!container) return
      const { width, height } = container.getBoundingClientRect()
      if (width === 0 || height === 0) return

      const scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT)
      baseScaleRef.current = scale
      const offsetX = (width - CANVAS_WIDTH * scale) / 2
      const offsetY = (height - CANVAS_HEIGHT * scale) / 2

      canvas.setDimensions({ width, height })
      canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY])
      onZoomChange?.(Math.round(scale * 100))
    })

    if (containerRef.current) observer.observe(containerRef.current)

    // ── Mouse-wheel zoom (centred on cursor) ──────────────────────────────────
    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent
      e.preventDefault()
      e.stopPropagation()

      const delta = e.deltaY
      let zoom = canvas.getZoom() * 0.999 ** delta
      zoom = Math.min(Math.max(zoom, 0.05), 20)
      canvas.zoomToPoint(new Point(e.offsetX, e.offsetY), zoom)
      onZoomChange?.(Math.round(zoom * 100))
    })

    // ── Drag-to-pan ───────────────────────────────────────────────────────────
    canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent
      isDragging.current = true
      lastPos.current = { x: e.clientX, y: e.clientY }
      if (elementRef.current) elementRef.current.style.cursor = 'grabbing'
    })

    canvas.on('mouse:move', (opt) => {
      if (!isDragging.current) return
      const e = opt.e as MouseEvent
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }

      const vpt = [...canvas.viewportTransform] as [number, number, number, number, number, number]
      vpt[4] += dx
      vpt[5] += dy
      canvas.setViewportTransform(vpt)
    })

    canvas.on('mouse:up', () => {
      isDragging.current = false
      if (elementRef.current) elementRef.current.style.cursor = 'grab'
    })

    // Set initial grab cursor
    if (elementRef.current) elementRef.current.style.cursor = 'grab'

    return () => {
      observer.disconnect()
      canvas.dispose()
      canvasRef.current = null
    }
  }, [canvasRef, containerRef, onZoomChange])

  return { canvasRef, elementRef, fitCanvas }
}
