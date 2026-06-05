import { Canvas, Circle, Line, Polyline, Polygon, Rect, FabricText } from 'fabric'
import { clamp } from '@/shared/lib/utils/clamp'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { RENDER_BATCH_SIZE, PALETTES, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/shared/constants/canvas.constants'
import type { WorkerPayload } from '@/entities/stroke-data/StrokeData.types'
import { ColorMode, PayloadType } from '@/shared/constants/shared.constant'
import type { RenderConfig } from '@/shared/constants/shared.constant'

function sampleAt(
  x: number,
  y: number,
  map: Float32Array,
  mapWidth: number,
  mapHeight: number
): number {
  const mx = Math.round((x / CANVAS_WIDTH) * (mapWidth - 1))
  const my = Math.round((y / CANVAS_HEIGHT) * (mapHeight - 1))
  const idx = clamp(my, 0, mapHeight - 1) * mapWidth + clamp(mx, 0, mapWidth - 1)
  return map[idx] ?? 0.5
}

function resolveColor(
  x: number,
  y: number,
  brightnessMap: Float32Array | null,
  rgbaMap: Uint8ClampedArray | null,
  mapWidth: number,
  mapHeight: number,
  config: RenderConfig
): string {
  switch (config.colorMode) {
    case ColorMode.Mono:
      return config.monoColor

    case ColorMode.Photo: {
      if (!rgbaMap) return config.monoColor
      const mx = Math.round((x / CANVAS_WIDTH) * (mapWidth - 1))
      const my = Math.round((y / CANVAS_HEIGHT) * (mapHeight - 1))
      const i = (clamp(my, 0, mapHeight - 1) * mapWidth + clamp(mx, 0, mapWidth - 1)) * 4
      return `rgb(${rgbaMap[i] ?? 0},${rgbaMap[i + 1] ?? 0},${rgbaMap[i + 2] ?? 0})`
    }

    case ColorMode.Palette: {
      const brightness = brightnessMap ? sampleAt(x, y, brightnessMap, mapWidth, mapHeight) : 0.5
      const palette = PALETTES[config.paletteIndex] ?? PALETTES[0]!
      const idx = Math.round(mapRange(1 - brightness, 0, 1, 0, palette.length - 1))
      return palette[clamp(idx, 0, palette.length - 1)]!
    }
  }
}

// For filled shapes (polys, rects): mono mode lerps between background and monoColor
// driven by brightness so shading is preserved. Lines/dots use resolveColor directly.
function resolveFilledColor(
  cx: number,
  cy: number,
  brightnessMap: Float32Array | null,
  rgbaMap: Uint8ClampedArray | null,
  mapWidth: number,
  mapHeight: number,
  config: RenderConfig
): string {
  if (config.colorMode === ColorMode.Mono) {
    const brightness = brightnessMap ? sampleAt(cx, cy, brightnessMap, mapWidth, mapHeight) : 0.5
    const hex = config.monoColor.replace('#', '')
    const mr = parseInt(hex.slice(0, 2), 16)
    const mg = parseInt(hex.slice(2, 4), 16)
    const mb = parseInt(hex.slice(4, 6), 16)
    const lum = (0.2126 * mr + 0.7152 * mg + 0.0722 * mb) / 255
    const bgV = lum > 0.5 ? 17 : 245
    const t = 1 - brightness
    return `rgb(${Math.round(bgV + (mr - bgV) * t)},${Math.round(bgV + (mg - bgV) * t)},${Math.round(bgV + (mb - bgV) * t)})`
  }
  return resolveColor(cx, cy, brightnessMap, rgbaMap, mapWidth, mapHeight, config)
}

function getBgColor(config: RenderConfig): string {
  if (config.colorMode !== ColorMode.Mono) return '#f5f5f5'
  // Light stroke → dark background; dark stroke → light background
  const hex = config.monoColor.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.5 ? '#111111' : '#f5f5f5'
}

export async function renderToFabric(
  canvas: Canvas,
  payload: WorkerPayload,
  config: RenderConfig,
  brightnessMap: Float32Array | null,
  rgbaMap: Uint8ClampedArray | null,
  mapWidth: number,
  mapHeight: number,
  onProgress: (pct: number) => void
): Promise<void> {
  canvas.clear()
  canvas.backgroundColor = getBgColor(config)
  canvas.renderOnAddRemove = false

  if (payload.type === PayloadType.Dots) {
    const total = payload.items.length
    for (let i = 0; i < total; i += RENDER_BATCH_SIZE) {
      const chunk = payload.items.slice(i, i + RENDER_BATCH_SIZE)
      for (const dot of chunk) {
        const color = resolveColor(dot.x, dot.y, brightnessMap, rgbaMap, mapWidth, mapHeight, config)
        canvas.add(
          new Circle({
            left: dot.x - dot.r,
            top: dot.y - dot.r,
            radius: dot.r,
            fill: color,
            strokeWidth: 0,
            selectable: false,
            evented: false,
            objectCaching: false,
            opacity: config.opacity,
          })
        )
      }
      onProgress(Math.round(((i + RENDER_BATCH_SIZE) / total) * 100))
      await new Promise<void>((r) => setTimeout(r, 0))
    }
  } else if (payload.type === PayloadType.Strokes) {
    const total = payload.items.length
    for (let i = 0; i < total; i += RENDER_BATCH_SIZE) {
      const chunk = payload.items.slice(i, i + RENDER_BATCH_SIZE)
      for (const stroke of chunk) {
        const mx = (stroke.x1 + stroke.x2) / 2
        const my = (stroke.y1 + stroke.y2) / 2
        const color = resolveColor(mx, my, brightnessMap, rgbaMap, mapWidth, mapHeight, config)
        canvas.add(
          new Line([stroke.x1, stroke.y1, stroke.x2, stroke.y2], {
            stroke: color,
            strokeWidth: stroke.weight,
            selectable: false,
            evented: false,
            objectCaching: false,
            opacity: config.opacity,
            strokeLineCap: 'round',
          })
        )
      }
      onProgress(Math.round(((i + RENDER_BATCH_SIZE) / total) * 100))
      await new Promise<void>((r) => setTimeout(r, 0))
    }
  } else if (payload.type === PayloadType.Polys) {
    const total = payload.items.length
    for (let i = 0; i < total; i += RENDER_BATCH_SIZE) {
      const chunk = payload.items.slice(i, i + RENDER_BATCH_SIZE)
      for (const tri of chunk) {
        const cx = (tri.a.x + tri.b.x + tri.c.x) / 3
        const cy = (tri.a.y + tri.b.y + tri.c.y) / 3
        const fill = resolveFilledColor(cx, cy, brightnessMap, rgbaMap, mapWidth, mapHeight, config)
        canvas.add(
          new Polygon([tri.a, tri.b, tri.c], {
            fill,
            stroke: fill,
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            objectCaching: false,
            opacity: config.opacity,
          })
        )
      }
      onProgress(Math.round(((i + RENDER_BATCH_SIZE) / total) * 100))
      await new Promise<void>((r) => setTimeout(r, 0))
    }
  } else if (payload.type === PayloadType.Rects) {
    const total = payload.items.length
    for (let i = 0; i < total; i += RENDER_BATCH_SIZE) {
      const chunk = payload.items.slice(i, i + RENDER_BATCH_SIZE)
      for (const rect of chunk) {
        const cx = rect.x + rect.w / 2
        const cy = rect.y + rect.h / 2
        const fill = resolveFilledColor(cx, cy, brightnessMap, rgbaMap, mapWidth, mapHeight, config)
        canvas.add(
          new Rect({
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            fill,
            strokeWidth: 0,
            selectable: false,
            evented: false,
            objectCaching: false,
            opacity: config.opacity,
          })
        )
      }
      onProgress(Math.round(((i + RENDER_BATCH_SIZE) / total) * 100))
      await new Promise<void>((r) => setTimeout(r, 0))
    }
  } else if (payload.type === PayloadType.Chars) {
    const total = payload.items.length
    const fontSize = Math.round((CANVAS_HEIGHT / config.density) * 0.9)
    for (let i = 0; i < total; i += RENDER_BATCH_SIZE) {
      const chunk = payload.items.slice(i, i + RENDER_BATCH_SIZE)
      for (const ch of chunk) {
        const color = resolveColor(ch.x, ch.y, brightnessMap, rgbaMap, mapWidth, mapHeight, config)
        canvas.add(
          new FabricText(ch.char, {
            left: ch.x,
            top: ch.y,
            originX: 'center',
            originY: 'center',
            fontSize,
            fontFamily: 'monospace',
            fill: color,
            selectable: false,
            evented: false,
            objectCaching: false,
            opacity: config.opacity,
          })
        )
      }
      onProgress(Math.round(((i + RENDER_BATCH_SIZE) / total) * 100))
      await new Promise<void>((r) => setTimeout(r, 0))
    }
  } else if (payload.type === PayloadType.Constellation) {
    const totalEdges = payload.edges.length
    const totalDots = payload.dots.length
    const total = totalEdges + totalDots

    // Render edges first so dots always appear on top
    for (let i = 0; i < totalEdges; i += RENDER_BATCH_SIZE) {
      const chunk = payload.edges.slice(i, i + RENDER_BATCH_SIZE)
      for (const edge of chunk) {
        const mx = (edge.x1 + edge.x2) / 2
        const my = (edge.y1 + edge.y2) / 2
        const color = resolveColor(mx, my, brightnessMap, rgbaMap, mapWidth, mapHeight, config)
        canvas.add(
          new Line([edge.x1, edge.y1, edge.x2, edge.y2], {
            stroke: color,
            strokeWidth: edge.weight,
            selectable: false,
            evented: false,
            objectCaching: false,
            opacity: config.opacity * 0.6, // edges slightly more transparent than dots
            strokeLineCap: 'round',
          })
        )
      }
      onProgress(Math.round(((i + RENDER_BATCH_SIZE) / total) * 50))
      await new Promise<void>((r) => setTimeout(r, 0))
    }

    for (let i = 0; i < totalDots; i += RENDER_BATCH_SIZE) {
      const chunk = payload.dots.slice(i, i + RENDER_BATCH_SIZE)
      for (const dot of chunk) {
        const color = resolveColor(dot.x, dot.y, brightnessMap, rgbaMap, mapWidth, mapHeight, config)
        canvas.add(
          new Circle({
            left: dot.x - dot.r,
            top: dot.y - dot.r,
            radius: dot.r,
            fill: color,
            strokeWidth: 0,
            selectable: false,
            evented: false,
            objectCaching: false,
            opacity: config.opacity,
          })
        )
      }
      onProgress(50 + Math.round(((i + RENDER_BATCH_SIZE) / total) * 50))
      await new Promise<void>((r) => setTimeout(r, 0))
    }
  } else {
    // paths — polylines for flow strands
    const total = payload.items.length
    for (let i = 0; i < total; i += RENDER_BATCH_SIZE) {
      const chunk = payload.items.slice(i, i + RENDER_BATCH_SIZE)
      for (const points of chunk) {
        if (points.length < 2) continue
        const mid = points[Math.floor(points.length / 2)] ?? points[0]!
        const brightness = brightnessMap ? sampleAt(mid.x, mid.y, brightnessMap, mapWidth, mapHeight) : 0.5
        const color = resolveColor(mid.x, mid.y, brightnessMap, rgbaMap, mapWidth, mapHeight, config)
        const weight = mapRange(1 - brightness, 0, 1, config.minSize, config.maxSize)
        canvas.add(
          new Polyline(points, {
            stroke: color,
            strokeWidth: weight,
            fill: '',
            selectable: false,
            evented: false,
            objectCaching: false,
            opacity: config.opacity,
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
          })
        )
      }
      onProgress(Math.round(((i + RENDER_BATCH_SIZE) / total) * 100))
      await new Promise<void>((r) => setTimeout(r, 0))
    }
  }

  canvas.renderOnAddRemove = true
  canvas.renderAll()
}
