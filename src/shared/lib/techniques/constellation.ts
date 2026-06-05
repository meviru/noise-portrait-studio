import { seededRandom } from '@/shared/lib/utils/seededRandom'
import { clamp } from '@/shared/lib/utils/clamp'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { sampleBrightness } from './imageUtils'
import { triangulate } from './lowPoly'
import type { Pt } from './lowPoly'
import type { DotItem, StrokeItem } from '@/entities/stroke-data/StrokeData.types'

export interface ConstellationConfig {
  canvasWidth: number
  canvasHeight: number
  density: number // number of seed points
  minSize: number // min dot radius
  maxSize: number // max dot radius
  seed: number
}

export interface ConstellationResult {
  dots: DotItem[]
  edges: StrokeItem[]
}

export function generateConstellation(
  config: ConstellationConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): ConstellationResult {
  const rand = seededRandom(config.seed)

  // ── Sample seed points biased toward darker areas ────────────────────────
  const pts: Pt[] = []
  const maxAttempts = config.density * 6

  for (let attempt = 0; pts.length < config.density && attempt < maxAttempts; attempt++) {
    const x = rand() * config.canvasWidth
    const y = rand() * config.canvasHeight
    const brightness = sampleBrightness(
      x, y, brightnessMap, mapWidth, mapHeight,
      config.canvasWidth, config.canvasHeight
    )
    // Accept with higher probability in darker regions
    if (rand() < (1 - brightness * 0.7)) pts.push({ x, y })
  }

  // ── Delaunay triangulation → unique edges ────────────────────────────────
  const tris = triangulate(pts, config.canvasWidth, config.canvasHeight)
  const seen = new Set<string>()
  const edges: StrokeItem[] = []

  for (const tri of tris) {
    for (const [a, b] of [[tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]] as [Pt, Pt][]) {
      // Canonical key so each edge is only added once
      const key = a.x < b.x || (a.x === b.x && a.y < b.y)
        ? `${a.x},${a.y},${b.x},${b.y}`
        : `${b.x},${b.y},${a.x},${a.y}`
      if (seen.has(key)) continue
      seen.add(key)

      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const brightness = sampleBrightness(
        mx, my, brightnessMap, mapWidth, mapHeight,
        config.canvasWidth, config.canvasHeight
      )
      // Fade edges out in bright highlight areas
      if (brightness > 0.92) continue

      const weight = mapRange(1 - brightness, 0, 1, 0.2, 0.6)
      edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, weight })
    }
  }

  // ── Build dot items ───────────────────────────────────────────────────────
  const dots: DotItem[] = pts.map(({ x, y }) => {
    const brightness = sampleBrightness(
      x, y, brightnessMap, mapWidth, mapHeight,
      config.canvasWidth, config.canvasHeight
    )
    const r = mapRange(
      clamp(1 - brightness, 0, 1),
      0, 1,
      config.minSize, config.maxSize
    )
    return { x, y, r }
  })

  return { dots, edges }
}
