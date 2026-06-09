import { seededRandom } from '@/shared/lib/utils/seededRandom'
import { clamp } from '@/shared/lib/utils/clamp'
import { mapRange } from '@/shared/lib/utils/mapRange'
import { poissonDisk } from '@/shared/lib/utils/poissonDisk'
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

  // ── Sample seed points biased toward darker areas (Poisson-disk) ────────────
  // minDist sized so the disk fills ~3× density candidates before filtering,
  // matching the approach used in stipple for even spatial coverage.
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

  const pts: Pt[] = []
  for (const { x, y } of candidates) {
    if (pts.length >= config.density) break
    const brightness = sampleBrightness(
      x, y, brightnessMap, mapWidth, mapHeight,
      config.canvasWidth, config.canvasHeight
    )
    // Accept with higher probability in darker regions (same rule as before)
    if (rand() < (1 - brightness * 0.7)) pts.push({ x, y })
  }

  // ── Delaunay triangulation → unique edges ────────────────────────────────
  const tris = triangulate(pts, config.canvasWidth, config.canvasHeight)
  const seen = new Set<string>()
  const edges: StrokeItem[] = []

  for (const tri of tris) {
    for (const [a, b] of [[tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]] as [Pt, Pt][]) {
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
    return {
      x, y,
      r: mapRange(clamp(1 - brightness, 0, 1), 0, 1, config.minSize, config.maxSize),
    }
  })

  return { dots, edges }
}
