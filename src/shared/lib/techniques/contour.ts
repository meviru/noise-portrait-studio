import type { GeneratedPath } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for iso-brightness contour line generation. */
export interface ContourConfig {
  canvasWidth: number
  canvasHeight: number
  contourLevels: number // 4–12
  minSize: number       // kept for API compatibility; weight is resolved by the renderer
}

// Marching squares case table
// Index = TL*8 + TR*4 + BR*2 + BL*1 (bit set when corner < threshold = "inside")
// Each entry: pairs of edges forming a line segment. Edges: 0=top, 1=right, 2=bottom, 3=left
const CASES: Array<[number, number][] | null> = [
  null,                   // 0  0000
  [[3, 2]],               // 1  0001  BL
  [[2, 1]],               // 2  0010  BR
  [[3, 1]],               // 3  0011  BR+BL
  [[0, 1]],               // 4  0100  TR
  [[0, 1], [3, 2]],       // 5  0101  TR+BL  saddle
  [[0, 2]],               // 6  0110  TR+BR
  [[0, 3]],               // 7  0111  TR+BR+BL
  [[0, 3]],               // 8  1000  TL
  [[0, 2]],               // 9  1001  TL+BL
  [[0, 3], [1, 2]],       // 10 1010  TL+BR  saddle
  [[0, 1]],               // 11 1011  TL+BR+BL
  [[3, 1]],               // 12 1100  TL+TR
  [[2, 1]],               // 13 1101  TL+TR+BL
  [[3, 2]],               // 14 1110  TL+TR+BR
  null,                   // 15 1111
]

function edgeT(a: number, b: number, threshold: number): number {
  const d = b - a
  return Math.abs(d) < 0.0001 ? 0.5 : (threshold - a) / d
}

interface Seg { x1: number; y1: number; x2: number; y2: number }

function marchLevel(
  brightness: Float32Array,
  mapWidth: number,
  mapHeight: number,
  threshold: number,
  scaleX: number,
  scaleY: number,
  output: Seg[]
): void {
  for (let y = 0; y < mapHeight - 1; y++) {
    for (let x = 0; x < mapWidth - 1; x++) {
      const tl = brightness[y * mapWidth + x]!
      const tr = brightness[y * mapWidth + (x + 1)]!
      const br = brightness[(y + 1) * mapWidth + (x + 1)]!
      const bl = brightness[(y + 1) * mapWidth + x]!

      const idx =
        (tl < threshold ? 8 : 0) |
        (tr < threshold ? 4 : 0) |
        (br < threshold ? 2 : 0) |
        (bl < threshold ? 1 : 0)

      const segs = CASES[idx]
      if (!segs) continue

      const topX = (x + edgeT(tl, tr, threshold)) * scaleX
      const rightY = (y + edgeT(tr, br, threshold)) * scaleY
      const botX = (x + edgeT(bl, br, threshold)) * scaleX
      const leftY = (y + edgeT(tl, bl, threshold)) * scaleY

      const edgePts: [number, number][] = [
        [topX, y * scaleY],
        [(x + 1) * scaleX, rightY],
        [botX, (y + 1) * scaleY],
        [x * scaleX, leftY],
      ]

      for (const [e1, e2] of segs) {
        const p1 = edgePts[e1]!
        const p2 = edgePts[e2]!
        output.push({ x1: p1[0]!, y1: p1[1]!, x2: p2[0]!, y2: p2[1]! })
      }
    }
  }
}

// Chain disconnected marching-squares segments into ordered polylines.
// Adjacent cells share exact floating-point endpoint coordinates (same formula,
// same threshold), so string keys correctly identify shared junctions without
// epsilon tolerance.
function chainSegments(segs: Seg[]): GeneratedPath[] {
  type Entry = { segIdx: number; end: 0 | 1 }
  const adj = new Map<string, Entry[]>()

  function ptKey(x: number, y: number) { return `${x},${y}` }
  function addAdj(k: string, e: Entry) {
    const list = adj.get(k)
    if (list) list.push(e)
    else adj.set(k, [e])
  }

  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]!
    addAdj(ptKey(s.x1, s.y1), { segIdx: i, end: 0 })
    addAdj(ptKey(s.x2, s.y2), { segIdx: i, end: 1 })
  }

  const used = new Uint8Array(segs.length)
  const chains: GeneratedPath[] = []

  for (let start = 0; start < segs.length; start++) {
    if (used[start]) continue
    used[start] = 1
    const s0 = segs[start]!
    const chain: GeneratedPath = [{ x: s0.x1, y: s0.y1 }, { x: s0.x2, y: s0.y2 }]

    // Extend forward from tail
    let going = true
    while (going) {
      going = false
      const tail = chain[chain.length - 1]!
      const neighbors = adj.get(ptKey(tail.x, tail.y))
      if (!neighbors) break
      for (const { segIdx, end } of neighbors) {
        if (used[segIdx]) continue
        used[segIdx] = 1
        const s = segs[segIdx]!
        chain.push(end === 0 ? { x: s.x2, y: s.y2 } : { x: s.x1, y: s.y1 })
        going = true
        break
      }
    }

    // Extend backward from head
    going = true
    while (going) {
      going = false
      const head = chain[0]!
      const neighbors = adj.get(ptKey(head.x, head.y))
      if (!neighbors) break
      for (const { segIdx, end } of neighbors) {
        if (used[segIdx]) continue
        used[segIdx] = 1
        const s = segs[segIdx]!
        chain.unshift(end === 0 ? { x: s.x2, y: s.y2 } : { x: s.x1, y: s.y1 })
        going = true
        break
      }
    }

    if (chain.length >= 2) chains.push(chain)
  }

  return chains
}

/**
 * Traces iso-brightness contour lines using marching squares, then chains the
 * resulting segments into continuous polylines. Produces evenly spaced threshold
 * levels between 0.05 and 0.95.
 *
 * @param config - Contour generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of chained polyline paths, one per connected contour segment
 */
export function generateContour(
  config: ContourConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): GeneratedPath[] {
  const scaleX = config.canvasWidth / mapWidth
  const scaleY = config.canvasHeight / mapHeight
  const allSegs: Seg[] = []

  // Collect segments from all levels; cross-level endpoints never coincide
  // (different threshold → different fractional interpolation), so chainSegments
  // produces correct per-level chains without explicit separation.
  for (let level = 0; level < config.contourLevels; level++) {
    const threshold = 0.05 + (0.9 * (level + 1)) / (config.contourLevels + 1)
    marchLevel(brightnessMap, mapWidth, mapHeight, threshold, scaleX, scaleY, allSegs)
  }

  return chainSegments(allSegs)
}
