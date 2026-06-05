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

// ── Internal types ────────────────────────────────────────────────────────────

export interface Pt { x: number; y: number }
interface DTri { a: Pt; b: Pt; c: Pt; cx: number; cy: number; r2: number }

// ── Circumcircle ──────────────────────────────────────────────────────────────

function circumcircle(a: Pt, b: Pt, c: Pt): { cx: number; cy: number; r2: number } {
  const ax = b.x - a.x, ay = b.y - a.y
  const bx = c.x - a.x, by = c.y - a.y
  const D = 2 * (ax * by - ay * bx)
  if (Math.abs(D) < 1e-10) return { cx: 0, cy: 0, r2: 1e18 }
  const ux = (by * (ax * ax + ay * ay) - ay * (bx * bx + by * by)) / D
  const uy = (ax * (bx * bx + by * by) - bx * (ax * ax + ay * ay)) / D
  return { cx: a.x + ux, cy: a.y + uy, r2: ux * ux + uy * uy }
}

function samePt(a: Pt, b: Pt) { return a.x === b.x && a.y === b.y }

function edgeMatch(a1: Pt, b1: Pt, a2: Pt, b2: Pt) {
  return (samePt(a1, a2) && samePt(b1, b2)) || (samePt(a1, b2) && samePt(b1, a2))
}

// ── Bowyer-Watson Delaunay triangulation ─────────────────────────────────────

export function triangulate(pts: Pt[], W: number, H: number): DTri[] {
  // Super-triangle large enough to contain all points
  const M = Math.max(W, H) * 4
  const sA: Pt = { x: W / 2, y: -M }
  const sB: Pt = { x: W / 2 - M * 1.5, y: H + M }
  const sC: Pt = { x: W / 2 + M * 1.5, y: H + M }
  let tris: DTri[] = [{ a: sA, b: sB, c: sC, ...circumcircle(sA, sB, sC) }]

  for (const p of pts) {
    // Bad triangles: circumcircle contains the new point
    const bad = tris.filter(t => {
      const dx = p.x - t.cx, dy = p.y - t.cy
      return dx * dx + dy * dy < t.r2 * (1 + 1e-10)
    })

    // Boundary polygon: edges not shared between any two bad triangles
    const boundary: [Pt, Pt][] = []
    for (const t of bad) {
      for (const edge of [[t.a, t.b], [t.b, t.c], [t.c, t.a]] as [Pt, Pt][]) {
        const shared = bad.some(o => o !== t && (
          edgeMatch(edge[0], edge[1], o.a, o.b) ||
          edgeMatch(edge[0], edge[1], o.b, o.c) ||
          edgeMatch(edge[0], edge[1], o.c, o.a)
        ))
        if (!shared) boundary.push(edge)
      }
    }

    const badSet = new Set(bad)
    tris = tris.filter(t => !badSet.has(t))

    for (const [e1, e2] of boundary) {
      tris.push({ a: e1, b: e2, c: p, ...circumcircle(e1, e2, p) })
    }
  }

  // Remove any triangle sharing a vertex with the super-triangle
  const superSet = new Set<Pt>([sA, sB, sC])
  return tris.filter(t => !superSet.has(t.a) && !superSet.has(t.b) && !superSet.has(t.c))
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

    // Base 25% acceptance everywhere; ramps up to 100% at strong edges so
    // detail-rich regions (eyes, lips, hair) attract more, smaller triangles.
    const acceptProb = Math.min(1, 0.25 + gradMag / 2.5)

    if (rand() < acceptProb) pts.push({ x, y })
  }

  return pts
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates Delaunay triangles using the Bowyer-Watson algorithm on a set of
 * edge-biased sample points. Points near strong gradients are accepted at a higher
 * rate, concentrating smaller triangles in detail-rich areas (eyes, lips, hair).
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
  const tris = triangulate(pts, config.canvasWidth, config.canvasHeight)
  return tris.map(t => ({ a: t.a, b: t.b, c: t.c }))
}
