/**
 * Bridson's Poisson-disk sampling algorithm.
 * Produces spatially uniform candidate positions (no clumping or cold spots).
 * Each point is guaranteed to be at least minDist from every other point.
 *
 * @param W         Canvas width
 * @param H         Canvas height
 * @param minDist   Minimum distance between any two points
 * @param maxPoints Hard cap on total output points
 * @param rand      Seeded [0,1) PRNG
 */
export function poissonDisk(
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
  const K = 30 // candidate attempts before retiring an active point

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
