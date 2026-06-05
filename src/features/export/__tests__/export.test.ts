import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportSVG } from '../exportSVG'
import { exportPNG } from '../exportPNG'

const mockCanvas = {
  toSVG: vi.fn(() => '<svg><rect/></svg>'),
  toDataURL: vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
  viewportTransform: [1, 0, 0, 1, 0, 0] as [number, number, number, number, number, number],
  width: 800,
  height: 800,
  backgroundColor: '#ffffff',
  setDimensions: vi.fn(),
  setViewportTransform: vi.fn(),
  renderAll: vi.fn(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockCanvas.toSVG.mockReturnValue('<svg><rect/></svg>')
  mockCanvas.toDataURL.mockReturnValue(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  )
  mockCanvas.viewportTransform = [1, 0, 0, 1, 0, 0]
  mockCanvas.setDimensions = vi.fn()
  mockCanvas.setViewportTransform = vi.fn()
  mockCanvas.renderAll = vi.fn()

  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  })

  const mockAnchor = {
    href: '',
    download: '',
    click: vi.fn(),
    style: { display: '' },
  }
  vi.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor as unknown as Node)
  vi.spyOn(document.body, 'removeChild').mockReturnValue(mockAnchor as unknown as Node)
  vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
})

describe('exportSVG', () => {
  it('returns ok:true when canvas.toSVG succeeds', () => {
    const result = exportSVG(mockCanvas as never)
    expect(result.ok).toBe(true)
  })

  it('returns ok:false when canvas.toSVG throws', () => {
    mockCanvas.toSVG.mockImplementationOnce(() => {
      throw new Error('SVG failed')
    })
    const result = exportSVG(mockCanvas as never)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('SVG failed')
  })
})

describe('exportPNG', () => {
  it('returns ok:true on success', () => {
    const result = exportPNG(mockCanvas as never)
    expect(result.ok).toBe(true)
  })

  it('returns ok:false when toDataURL throws', () => {
    mockCanvas.toDataURL.mockImplementationOnce(() => {
      throw new Error('PNG failed')
    })
    const result = exportPNG(mockCanvas as never)
    expect(result.ok).toBe(false)
  })
})
