import { Delaunay } from 'd3-delaunay'
import { seededRandom } from '@/shared/lib/utils/seededRandom'
import { clamp } from '@/shared/lib/utils/clamp'
import { sobelGradient } from './imageUtils'
import type { TriangleItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for low-poly triangle generation. */
export interface LowPolyConfig {
  canvasWidth: number
  canvasHeight: number
  density: number  // number of sample points → roughly 2× triangles
  seed: number
}

export interface Pt { x: number; y: number }

// ── Delaunay triangulation (d3-delaunay, O(n log n)) ─────────────────────────

/**
 * Triangulate a set of 2-D points using d3-delaunay (Fortune's sweep, O(n log n)).
 * Exported so constellation.ts can reuse it for its edge-only rendering.
 */
export function triangulate(pts: Pt[], _W: number, _H: number): { a: Pt; b: Pt; c: Pt }[] {
  if (pts.length < 3) return []
  const coords = new Float64Array(pts.length * 2)
  for (let i = 0; i < pts.length; i++) {
    coords[i * 2] = pts[i]!.x
    coords[i * 2 + 1] = pts[i]!.y
  }
  const { triangles } = new Delaunay(coords)
  const result: { a: Pt; b: Pt; c: Pt }[] = []
  for (let i = 0; i < triangles.length; i += 3) {
    result.push({
      a: pts[triangles[i]!]!,
      b: pts[triangles[i + 1]!]!,
      c: pts[triangles[i + 2]!]!,
    })
  }
  return result
}

// ── Edge-biased point sampling ────────────────────────────────────────────────

function samplePoints(
  config: LowPolyConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): Pt[] {
  const rand = seededRandom(config.seed)
  const { canvasWidth, canvasHeight } = config
  const pts: Pt[] = []

  // Always include corners + edge midpoints so triangles cover the full canvas
  pts.push(
    { x: 0, y: 0 }, { x: canvasWidth, y: 0 },
    { x: canvasWidth, y: canvasHeight }, { x: 0, y: canvasHeight },
    { x: canvasWidth / 2, y: 0 }, { x: canvasWidth, y: canvasHeight / 2 },
    { x: canvasWidth / 2, y: canvasHeight }, { x: 0, y: canvasHeight / 2 },
  )

  const { dx, dy } = sobelGradient(brightnessMap, mapWidth, mapHeight)
  const maxAttempts = config.density * 8

  for (let attempt = 0; pts.length < config.density && attempt < maxAttempts; attempt++) {
    const x = rand() * canvasWidth
    const y = rand() * canvasHeight

    const mx = clamp(Math.round((x / canvasWidth) * (mapWidth - 1)), 0, mapWidth - 1)
    const my = clamp(Math.round((y / canvasHeight) * (mapHeight - 1)), 0, mapHeight - 1)
    const mi = my * mapWidth + mx
    const gx = dx[mi] ?? 0
    const gy = dy[mi] ?? 0
    const gradMag = Math.sqrt(gx * gx + gy * gy)

    // Base 25% acceptance everywhere; ramps to 100% at strong edges so
    // detail-rich regions (eyes, lips, hair) attract more, smaller triangles.
    const acceptProb = Math.min(1, 0.25 + gradMag / 2.5)

    if (rand() < acceptProb) pts.push({ x, y })
  }

  return pts
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates Delaunay triangles using d3-delaunay on a set of edge-biased sample
 * points. Replaces the former O(n²) Bowyer-Watson implementation, allowing much
 * higher density values without browser hangs.
 *
 * @param config - Low-poly generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of triangles covering the full canvas
 */
export function generateLowPoly(
  config: LowPolyConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): TriangleItem[] {
  const pts = samplePoints(config, brightnessMap, mapWidth, mapHeight)
  return triangulate(pts, config.canvasWidth, config.canvasHeight)
}
