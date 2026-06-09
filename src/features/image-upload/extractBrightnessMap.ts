import { MAX_SAMPLE_SIZE } from '@/shared/constants/canvas.constants'

export interface BrightnessResult {
  map: Float32Array
  rgbaMap: Uint8ClampedArray
  width: number
  height: number
}

// Separable Gaussian blur on a Float32Array brightness map.
// Two-pass (horizontal then vertical) with a 5-tap kernel derived from sigma.
// Suppresses JPEG compression noise and skin-texture artifacts before edge
// detection techniques (Sobel) run on the map.
function gaussianBlur(src: Float32Array, W: number, H: number, sigma: number): Float32Array {
  const radius = Math.ceil(sigma * 2)
  const size = radius * 2 + 1
  const kernel = new Float32Array(size)
  let sum = 0
  for (let k = 0; k < size; k++) {
    const x = k - radius
    kernel[k] = Math.exp(-(x * x) / (2 * sigma * sigma))
    sum += kernel[k]!
  }
  for (let k = 0; k < size; k++) kernel[k] = kernel[k]! / sum

  const tmp = new Float32Array(W * H)

  // Horizontal pass
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let acc = 0
      for (let k = 0; k < size; k++) {
        const sx = Math.min(W - 1, Math.max(0, x + k - radius))
        acc += src[y * W + sx]! * kernel[k]!
      }
      tmp[y * W + x] = acc
    }
  }

  // Vertical pass
  const dst = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let acc = 0
      for (let k = 0; k < size; k++) {
        const sy = Math.min(H - 1, Math.max(0, y + k - radius))
        acc += tmp[sy * W + x]! * kernel[k]!
      }
      dst[y * W + x] = acc
    }
  }

  return dst
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

  const raw = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4]!
    const g = data[i * 4 + 1]!
    const b = data[i * 4 + 2]!
    // Perceptual luminance (ITU-R BT.709)
    raw[i] = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255
  }

  // Smooth out JPEG noise / skin texture before techniques run Sobel on this map.
  // sigma=1.2 removes high-frequency compression artifacts while keeping
  // facial feature edges (eyes, lips, jaw) intact.
  const map = gaussianBlur(raw, W, H, 1.2)

  // Store full RGBA for photo-color mode
  const rgbaMap = new Uint8ClampedArray(data)

  return { map, rgbaMap, width: W, height: H }
}
