import { MAX_SAMPLE_SIZE } from '@/shared/constants/canvas.constants'

export interface BrightnessResult {
  map: Float32Array
  rgbaMap: Uint8ClampedArray
  width: number
  height: number
}

export function extractBrightnessMap(img: HTMLImageElement): BrightnessResult {
  const scale = Math.min(1, MAX_SAMPLE_SIZE / Math.max(img.width, img.height))
  const W = Math.round(img.width * scale)
  const H = Math.round(img.height * scale)

  const offscreen = document.createElement('canvas')
  offscreen.width = W
  offscreen.height = H
  const ctx = offscreen.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D context for brightness extraction')

  ctx.drawImage(img, 0, 0, W, H)
  const imageData = ctx.getImageData(0, 0, W, H)
  const { data } = imageData

  const map = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4]!
    const g = data[i * 4 + 1]!
    const b = data[i * 4 + 2]!
    // Perceptual luminance (ITU-R BT.709)
    map[i] = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255
  }

  // Store full RGBA for photo-color mode
  const rgbaMap = new Uint8ClampedArray(data)

  return { map, rgbaMap, width: W, height: H }
}
