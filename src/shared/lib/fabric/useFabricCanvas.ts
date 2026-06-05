import { useEffect, useRef, useCallback } from 'react'
import type { MutableRefObject, RefObject } from 'react'
import { Canvas, Point } from 'fabric'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/shared/constants/canvas.constants'

interface UseFabricCanvasReturn {
  canvasRef: MutableRefObject<Canvas | null>
  elementRef: MutableRefObject<HTMLCanvasElement | null>
  fitCanvas: () => void
}

/**
 * Initialises a Fabric.js canvas, wires zoom/pan/touch interactions, and returns fit and ref handles.
 * @param containerRef - Ref to the wrapping div used to measure available space.
 * @param externalCanvasRef - Optional ref to share the Canvas instance with a parent.
 * @param onZoomChange - Called with the new zoom percentage whenever the zoom level changes.
 * @returns Object with `canvasRef`, `elementRef`, and `fitCanvas`.
 */
export function useFabricCanvas(
  containerRef: RefObject<HTMLDivElement | null>,
  externalCanvasRef?: MutableRefObject<Canvas | null>,
  onZoomChange?: (pct: number) => void
): UseFabricCanvasReturn {
  /**
   * Fallback canvas ref used when no external ref is provided by the caller.
   */
  const internalCanvasRef = useRef<Canvas | null>(null)
  const canvasRef = externalCanvasRef ?? internalCanvasRef
  const elementRef = useRef<HTMLCanvasElement | null>(null)
  /**
   * Scale at which the canvas fits its container; used to restore fit after a manual zoom.
   */
  const baseScaleRef = useRef(1)

  /**
   * Scales and centers the canvas to fill its container at the computed fit scale.
   */
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

    // Fabric creates a DOM structure around the canvas element we pass in:
    //
    //   wrapperEl  (div, position:relative)
    //     lowerCanvasEl  (the canvas we passed — draws the scene)
    //     upperCanvasEl  (transparent overlay — captures ALL pointer/touch events)
    //
    // touch-action and event listeners MUST go on upperCanvasEl / wrapperEl,
    // not on lowerCanvasEl (which sits underneath and never receives events).
    const upper = canvas.upperCanvasEl
    const wrapper = canvas.wrapperEl

    // Block the browser from handling any touch gesture (pinch-zoom, scroll) on
    // the canvas area. Without this the browser zooms or scrolls the viewport
    // while Fabric has no knowledge of it, causing a blank / mis-sized canvas.
    wrapper.style.touchAction = 'none'
    upper.style.cursor = 'grab'

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

    // ── Wheel zoom (mouse wheel + trackpad pinch) ─────────────────────────────
    // Registered as a native listener with passive:false so that preventDefault()
    // actually blocks the browser's own zoom before it acts on the event.
    // Fabric's canvas.on('mouse:wheel') goes through its internal pipeline and
    // cannot guarantee the listener is non-passive, so we bypass it here.
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      let zoom = canvas.getZoom() * 0.999 ** e.deltaY
      zoom = Math.min(Math.max(zoom, 0.05), 20)
      const rect = wrapper.getBoundingClientRect()
      canvas.zoomToPoint(new Point(e.clientX - rect.left, e.clientY - rect.top), zoom)
      onZoomChange?.(Math.round(zoom * 100))
    }

    upper.addEventListener('wheel', onWheel, { passive: false })

    // ── Mouse drag-to-pan ─────────────────────────────────────────────────────
    // Guard with `instanceof MouseEvent`: on touch devices Fabric maps touch
    // events to mouse:*, making opt.e a TouchEvent. TouchEvent has no .clientX /
    // .clientY, so math without the guard produces NaN and breaks panning.
    let isDragging = false
    let lastMousePos = { x: 0, y: 0 }

    canvas.on('mouse:down', (opt) => {
      if (!(opt.e instanceof MouseEvent)) return
      isDragging = true
      lastMousePos = { x: opt.e.clientX, y: opt.e.clientY }
      upper.style.cursor = 'grabbing'
    })

    canvas.on('mouse:move', (opt) => {
      if (!isDragging || !(opt.e instanceof MouseEvent)) return
      const dx = opt.e.clientX - lastMousePos.x
      const dy = opt.e.clientY - lastMousePos.y
      lastMousePos = { x: opt.e.clientX, y: opt.e.clientY }
      const vpt = [...canvas.viewportTransform] as [number, number, number, number, number, number]
      vpt[4] += dx
      vpt[5] += dy
      canvas.setViewportTransform(vpt)
    })

    canvas.on('mouse:up', (opt) => {
      if (!(opt.e instanceof MouseEvent)) return
      isDragging = false
      upper.style.cursor = 'grab'
    })

    // ── Touch pan & pinch-zoom ────────────────────────────────────────────────
    // Listeners go on `upper` (the topmost element that receives touch events).
    let lastTouchDist = 0
    let isTouchPanning = false
    let lastTouchPos = { x: 0, y: 0 }

    /**
     * Returns the pixel distance between two touch points for pinch-zoom scaling.
     * @param e - TouchEvent with at least two active touches.
     * @returns Distance in pixels between touch[0] and touch[1].
     */
    function pinchDist(e: TouchEvent): number {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 2) {
        isTouchPanning = false
        lastTouchDist = pinchDist(e)
      } else if (e.touches.length === 1) {
        isTouchPanning = true
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 2) {
        const dist = pinchDist(e)
        if (!lastTouchDist) { lastTouchDist = dist; return }
        const rect = wrapper.getBoundingClientRect()
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
        let zoom = canvas.getZoom() * (dist / lastTouchDist)
        zoom = Math.min(Math.max(zoom, 0.05), 20)
        canvas.zoomToPoint(new Point(midX, midY), zoom)
        onZoomChange?.(Math.round(zoom * 100))
        lastTouchDist = dist
      } else if (e.touches.length === 1 && isTouchPanning) {
        const dx = e.touches[0].clientX - lastTouchPos.x
        const dy = e.touches[0].clientY - lastTouchPos.y
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        const vpt = [...canvas.viewportTransform] as [number, number, number, number, number, number]
        vpt[4] += dx
        vpt[5] += dy
        canvas.setViewportTransform(vpt)
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length === 0) {
        isTouchPanning = false
        lastTouchDist = 0
      } else if (e.touches.length === 1) {
        // One finger lifted mid-pinch — seamlessly transition to single-finger pan
        isTouchPanning = true
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        lastTouchDist = 0
      }
    }

    upper.addEventListener('touchstart', onTouchStart, { passive: false })
    upper.addEventListener('touchmove', onTouchMove, { passive: false })
    upper.addEventListener('touchend', onTouchEnd)

    return () => {
      upper.removeEventListener('wheel', onWheel)
      upper.removeEventListener('touchstart', onTouchStart)
      upper.removeEventListener('touchmove', onTouchMove)
      upper.removeEventListener('touchend', onTouchEnd)
      observer.disconnect()
      canvas.dispose()
      canvasRef.current = null
    }
  }, [canvasRef, containerRef, onZoomChange])

  return { canvasRef, elementRef, fitCanvas }
}
