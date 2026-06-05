import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withCleanViewport } from '../exportUtils'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/shared/constants/canvas.constants'

const makeCanvas = (overrides = {}) => ({
  width: 1200,
  height: 700,
  backgroundColor: '#f5f5f5',
  viewportTransform: [1.2, 0, 0, 1.2, -100, -50] as [number, number, number, number, number, number],
  setDimensions: vi.fn(),
  setViewportTransform: vi.fn(),
  renderAll: vi.fn(),
  ...overrides,
})

describe('withCleanViewport', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('resets canvas to logical dimensions before calling fn', () => {
    const canvas = makeCanvas()
    withCleanViewport(canvas as never, () => {
      expect(canvas.setDimensions).toHaveBeenCalledWith({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
      expect(canvas.setViewportTransform).toHaveBeenCalledWith([1, 0, 0, 1, 0, 0])
      return undefined
    })
  })

  it('restores original dimensions and transform after fn', () => {
    const canvas = makeCanvas()
    withCleanViewport(canvas as never, () => undefined)

    expect(canvas.setDimensions).toHaveBeenLastCalledWith({ width: 1200, height: 700 })
    expect(canvas.setViewportTransform).toHaveBeenLastCalledWith([1.2, 0, 0, 1.2, -100, -50])
    expect(canvas.renderAll).toHaveBeenCalledOnce()
  })

  it('passes through the return value of fn', () => {
    const canvas = makeCanvas()
    const result = withCleanViewport(canvas as never, () => 'exported-data')
    expect(result).toBe('exported-data')
  })

  it('restores canvas state even when fn throws', () => {
    const canvas = makeCanvas()
    expect(() =>
      withCleanViewport(canvas as never, () => { throw new Error('fn failed') })
    ).toThrow('fn failed')

    expect(canvas.setDimensions).toHaveBeenLastCalledWith({ width: 1200, height: 700 })
    expect(canvas.setViewportTransform).toHaveBeenLastCalledWith([1.2, 0, 0, 1.2, -100, -50])
    expect(canvas.renderAll).toHaveBeenCalledOnce()
  })
})
