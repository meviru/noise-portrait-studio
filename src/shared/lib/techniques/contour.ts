import type { StrokeItem } from '@/entities/stroke-data/StrokeData.types'

/** Configuration for iso-brightness contour line generation. */
export interface ContourConfig {
  canvasWidth: number
  canvasHeight: number
  contourLevels: number // 4–12
  minSize: number // stroke weight
}

// Marching squares case table
// Index = TL*8 + TR*4 + BR*2 + BL*1 (bit set when corner < threshold = "inside")
// Each entry: pairs of edges forming a line segment. Edges: 0=top, 1=right, 2=bottom, 3=left
const CASES: Array<[number, number][] | null> = [
  null,                   // 0  0000
  [[3, 2]],               // 1  0001  BL        left→bottom
  [[2, 1]],               // 2  0010  BR        bottom→right
  [[3, 1]],               // 3  0011  BR+BL     left→right
  [[0, 1]],               // 4  0100  TR        top→right
  [[0, 1], [3, 2]],       // 5  0101  TR+BL     saddle: top→right, left→bottom
  [[0, 2]],               // 6  0110  TR+BR     top→bottom
  [[0, 3]],               // 7  0111  TR+BR+BL  top→left
  [[0, 3]],               // 8  1000  TL        top→left
  [[0, 2]],               // 9  1001  TL+BL     top→bottom
  [[0, 3], [1, 2]],       // 10 1010  TL+BR     saddle: top→left, right→bottom
  [[0, 1]],               // 11 1011  TL+BR+BL  top→right
  [[3, 1]],               // 12 1100  TL+TR     left→right
  [[2, 1]],               // 13 1101  TL+TR+BL  bottom→right
  [[3, 2]],               // 14 1110  TL+TR+BR  left→bottom
  null,                   // 15 1111
]

function edgeT(a: number, b: number, threshold: number): number {
  const d = b - a
  return Math.abs(d) < 0.0001 ? 0.5 : (threshold - a) / d
}

function marchLevel(
  brightness: Float32Array,
  mapWidth: number,
  mapHeight: number,
  threshold: number,
  scaleX: number,
  scaleY: number,
  weight: number,
  output: StrokeItem[]
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

      // Interpolated edge crossing points in canvas space
      const topX = (x + edgeT(tl, tr, threshold)) * scaleX
      const rightY = (y + edgeT(tr, br, threshold)) * scaleY
      const botX = (x + edgeT(bl, br, threshold)) * scaleX
      const leftY = (y + edgeT(tl, bl, threshold)) * scaleY

      const edgePts: [number, number][] = [
        [topX, y * scaleY],          // 0 top
        [(x + 1) * scaleX, rightY],  // 1 right
        [botX, (y + 1) * scaleY],    // 2 bottom
        [x * scaleX, leftY],         // 3 left
      ]

      for (const [e1, e2] of segs) {
        const p1 = edgePts[e1]!
        const p2 = edgePts[e2]!
        output.push({ x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], weight })
      }
    }
  }
}

/**
 * Traces iso-brightness contour lines using the marching squares algorithm.
 * Produces evenly spaced threshold levels between 0.05 and 0.95.
 *
 * @param config - Contour generation parameters
 * @param brightnessMap - Packed [0,1] brightness values in row-major order
 * @param mapWidth - Width of the brightness map in pixels
 * @param mapHeight - Height of the brightness map in pixels
 * @returns Array of interpolated contour line segments scaled to canvas space
 */
export function generateContour(
  config: ContourConfig,
  brightnessMap: Float32Array,
  mapWidth: number,
  mapHeight: number
): StrokeItem[] {
  const strokes: StrokeItem[] = []
  const scaleX = config.canvasWidth / mapWidth
  const scaleY = config.canvasHeight / mapHeight

  for (let level = 0; level < config.contourLevels; level++) {
    // Evenly spaced thresholds between 0.05 and 0.95
    const threshold = 0.05 + (0.9 * (level + 1)) / (config.contourLevels + 1)
    marchLevel(brightnessMap, mapWidth, mapHeight, threshold, scaleX, scaleY, config.minSize, strokes)
  }

  return strokes
}
