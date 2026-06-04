import type { PathPoint } from '@/entities/stroke-data/StrokeData.types'

export function pointsToSVGPath(points: PathPoint[]): string {
  if (points.length < 2) return ''
  const parts = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
  return parts.join(' ')
}
