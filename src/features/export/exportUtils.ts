import type { Canvas } from 'fabric'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/shared/constants/canvas.constants'

/**
 * Temporarily resets the canvas to its logical 800×800 dimensions with an
 * identity viewport transform, runs `fn`, then restores the previous state.
 *
 * Why: the canvas element is normally sized to the container (e.g. 1200×700)
 * with a centring/zoom viewport transform. Calling toSVG() or toDataURL()
 * without this reset exports the container-sized canvas with the art offset
 * by (offsetX, offsetY), producing off-centre output. Resetting to the
 * logical 800×800 with no transform places the art at (0,0) in every export.
 */
export function withCleanViewport<T>(canvas: Canvas, fn: () => T): T {
  const savedWidth = canvas.width ?? CANVAS_WIDTH
  const savedHeight = canvas.height ?? CANVAS_HEIGHT
  const savedVpt = [...canvas.viewportTransform] as [number, number, number, number, number, number]

  canvas.setDimensions({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])

  try {
    return fn()
  } finally {
    canvas.setDimensions({ width: savedWidth, height: savedHeight })
    canvas.setViewportTransform(savedVpt)
    canvas.renderAll()
  }
}
