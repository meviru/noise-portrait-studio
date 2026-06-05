import { clamp } from '@/shared/lib/utils/clamp'

/**
 * Samples the brightness map at a given canvas position.
 *
 * @param x - Canvas x coordinate
 * @param y - Canvas y coordinate
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @param canvasWidth - Logical canvas width used to map coordinates
 * @param canvasHeight - Logical canvas height used to map coordinates
 * @returns Brightness value in [0,1]; 0.5 when out of bounds
 */
export function sampleBrightness(
  x: number,
  y: number,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number,
  canvasWidth: number,
  canvasHeight: number
): number {
  const mx = Math.round((x / canvasWidth) * (mapWidth - 1))
  const my = Math.round((y / canvasHeight) * (mapHeight - 1))
  const idx = clamp(my, 0, mapHeight - 1) * mapWidth + clamp(mx, 0, mapWidth - 1)
  return brightnessMap[idx] ?? 0.5
}

/**
 * Computes per-pixel Sobel edge-detection gradient vectors for a brightness map.
 *
 * @param brightness - Packed [0,1] brightness values in row-major order
 * @param width - Map width in pixels
 * @param height - Map height in pixels
 * @returns `dx` and `dy` gradient arrays in the same row-major layout; border pixels are zero
 */
export function sobelGradient(
  brightness: Float32Array,
  width: number,
  height: number
): { dx: Float32Array; dy: Float32Array } {
  const dx = new Float32Array(width * height)
  const dy = new Float32Array(width * height)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const tl = brightness[(y - 1) * width + (x - 1)]!
      const tc = brightness[(y - 1) * width + x]!
      const tr = brightness[(y - 1) * width + (x + 1)]!
      const ml = brightness[y * width + (x - 1)]!
      const mr = brightness[y * width + (x + 1)]!
      const bl = brightness[(y + 1) * width + (x - 1)]!
      const bc = brightness[(y + 1) * width + x]!
      const br = brightness[(y + 1) * width + (x + 1)]!

      dx[y * width + x] = -tl + tr - 2 * ml + 2 * mr - bl + br
      dy[y * width + x] = -tl - 2 * tc - tr + bl + 2 * bc + br
    }
  }

  return { dx, dy }
}
