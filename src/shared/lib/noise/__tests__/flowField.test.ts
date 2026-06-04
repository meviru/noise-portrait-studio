import { describe, it, expect } from 'vitest'
import { generateFlowPaths } from '../flowField'
import type { FlowFieldConfig } from '@/entities/stroke-data/StrokeData.types'

const BASE_CONFIG: FlowFieldConfig = {
  width: 400,
  height: 400,
  noiseScale: 0.004,
  octaves: 2,
  stepLength: 8,
  stepCount: 20,
  particleCount: 50,
  maxStrokeWeight: 2,
  minStrokeWeight: 0.3,
  seed: 1234,
}

const flatMap = new Float32Array(100 * 100).fill(0.5)

describe('generateFlowPaths', () => {
  it('returns the expected number of paths', () => {
    const paths = generateFlowPaths(BASE_CONFIG, flatMap, 100, 100)
    expect(paths.length).toBeLessThanOrEqual(BASE_CONFIG.particleCount)
    expect(paths.length).toBeGreaterThan(0)
  })

  it('is deterministic — same seed always produces identical output', () => {
    const a = generateFlowPaths(BASE_CONFIG, flatMap, 100, 100)
    const b = generateFlowPaths(BASE_CONFIG, flatMap, 100, 100)
    expect(a).toEqual(b)
  })

  it('produces different output for different seeds', () => {
    const a = generateFlowPaths(BASE_CONFIG, flatMap, 100, 100)
    const b = generateFlowPaths({ ...BASE_CONFIG, seed: 9999 }, flatMap, 100, 100)
    expect(a[0]?.[0]).not.toEqual(b[0]?.[0])
  })

  it('all path points stay within canvas bounds', () => {
    const paths = generateFlowPaths(BASE_CONFIG, flatMap, 100, 100)
    for (const path of paths) {
      for (const pt of path) {
        expect(pt.x).toBeGreaterThanOrEqual(0)
        expect(pt.x).toBeLessThanOrEqual(BASE_CONFIG.width)
        expect(pt.y).toBeGreaterThanOrEqual(0)
        expect(pt.y).toBeLessThanOrEqual(BASE_CONFIG.height)
      }
    }
  })
})
