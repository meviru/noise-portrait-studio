import { sampleBrightness } from './imageUtils'
import type { CharItem } from '@/entities/stroke-data/StrokeData.types'

const CHAR_RAMP = ' .:-=+*#%@'
const CHAR_ASPECT = 0.55 // monospace char width / height

export interface AsciiArtConfig {
  canvasWidth: number
  canvasHeight: number
  density: number // character rows
}

export function generateAsciiArt(
  config: AsciiArtConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): CharItem[] {
  const chars: CharItem[] = []
  const cellH = config.canvasHeight / config.density
  const fontSize = Math.round(cellH * 0.9)
  const cellW = fontSize * CHAR_ASPECT
  const numRows = config.density
  const numCols = Math.ceil(config.canvasWidth / cellW)

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const cx = col * cellW + cellW / 2
      const cy = row * cellH + cellH / 2

      const brightness = sampleBrightness(
        cx, cy,
        brightnessMap, mapWidth, mapHeight,
        config.canvasWidth, config.canvasHeight
      )

      const charIdx = Math.min(CHAR_RAMP.length - 1, Math.floor((1 - brightness) * CHAR_RAMP.length))
      const char = CHAR_RAMP[charIdx]!

      if (char === ' ') continue

      chars.push({ x: cx, y: cy, char })
    }
  }

  return chars
}
