import { seededRandom } from '@/shared/lib/utils/seededRandom'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { sampleBrightness } from './imageUtils'
import type { DotItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for stipple dot generation. */
export interface StippleConfig {
  canvasWidth: number
  canvasHeight: number
  density: number
  minSize: number
  maxSize: number
  seed: number
}

// Bridson's Poisson-disk sampling algorithm.
// Produces spatially even candidate positions (no clumping or cold spots)
// across the canvas. Each call returns up to maxPoints positions.
function poissonDisk(
  W: number,
  H: number,
  minDist: number,
  maxPoints: number,
  rand: () => number
): { x: number; y: number }[] {
  const cellSize = minDist / Math.SQRT2
  const gridW = Math.ceil(W / cellSize) + 1
  const gridH = Math.ceil(H / cellSize) + 1
  const grid = new Int32Array(gridW * gridH).fill(-1)
  const pts: { x: number; y: number }[] = []
  const active: number[] = []
  const K = 30 // candidate attempts before deactivating a point

  function tooClose(x: number, y: number): boolean {
    const gx = Math.floor(x / cellSize)
    const gy = Math.floor(y / cellSize)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = gx + dx, ny = gy + dy
        if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue
        const idx = grid[ny * gridW + nx]
        if (idx < 0) continue
        const p = pts[idx]!
        const ddx = p.x - x, ddy = p.y - y
        if (ddx * ddx + ddy * ddy < minDist * minDist) return true
      }
    }
    return false
  }

  function addPt(x: number, y: number) {
    const i = pts.length
    pts.push({ x, y })
    grid[Math.floor(y / cellSize) * gridW + Math.floor(x / cellSize)] = i
    active.push(i)
  }

  addPt(rand() * W, rand() * H)

  while (active.length > 0 && pts.length < maxPoints) {
    const ai = Math.floor(rand() * active.length)
    const p = pts[active[ai]!]!
    let found = false

    for (let k = 0; k < K; k++) {
      const angle = rand() * Math.PI * 2
      const r = minDist * (1 + rand()) // annulus [minDist, 2*minDist]
      const nx = p.x + Math.cos(angle) * r
      const ny = p.y + Math.sin(angle) * r
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
      if (tooClose(nx, ny)) continue
      addPt(nx, ny)
      found = true
      break
    }

    if (!found) active.splice(ai, 1)
  }

  return pts
}

/**
 * Generates stipple dots using Bridson's Poisson-disk sampling for even spatial
 * coverage, then applies a brightness-weighted acceptance pass. The Poisson-disk
 * eliminates the cold-spot gaps that rejection-only sampling produces in uniform
 * or lightly-toned areas.
 *
 * @param config - Stipple generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of dot positions and radii
 */
export function generateStipple(
  config: StippleConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): DotItem[] {
  const rand = seededRandom(config.seed)

  // minDist sized so the disk fills ~3× density candidates before the
  // brightness filter reduces the set to roughly the target density.
  const minDist = Math.sqrt(
    (config.canvasWidth * config.canvasHeight) / (config.density * 3)
  )

  const candidates = poissonDisk(
    config.canvasWidth,
    config.canvasHeight,
    minDist,
    config.density * 4,
    rand
  )

  const dots: DotItem[] = []
  for (const { x, y } of candidates) {
    if (dots.length >= config.density) break
    const brightness = sampleBrightness(
      x, y, brightnessMap, mapWidth, mapHeight,
      config.canvasWidth, config.canvasHeight
    )
    // Accept with probability proportional to darkness
    if (rand() > brightness) {
      const r = mapRange(1 - brightness, 0, 1, config.minSize, config.maxSize)
      dots.push({ x, y, r })
    }
  }

  return dots
}
