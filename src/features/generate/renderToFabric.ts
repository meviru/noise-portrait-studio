import { Canvas, Circle, Line } from 'fabric'
import { clamp } from '@/shared/lib/utils/clamp'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { RENDER_BATCH_SIZE, PALETTES, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/shared/constants/canvas.constants'
import type { WorkerPayload } from '@/entities/stroke-data/StrokeData.types'
import type { RenderConfig } from '@/entities/noise-config/NoiseConfig.types'
import { ColorMode } from '@/entities/noise-config/utility/constants/noise-config.constant'

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

  const items = payload.items
  const total = items.length

  if (payload.type === 'dots') {
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
  } else {
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
  }

  canvas.renderOnAddRemove = true
  canvas.renderAll()
}
