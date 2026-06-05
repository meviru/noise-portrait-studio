import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportSVG } from '../exportSVG'
import { exportPNG } from '../exportPNG'
import { exportPDF } from '../exportPDF'
import * as jspdfModule from 'jspdf'

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function (this: Record<string, unknown>) {
    this.internal = { pageSize: { getWidth: () => 595, getHeight: () => 842 } }
    this.addImage = vi.fn()
    this.save = vi.fn()
  }),
}))

const makeCanvas = () => ({
  toSVG: vi.fn(() => '<svg><rect/></svg>'),
  toDataURL: vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
  viewportTransform: [1, 0, 0, 1, 0, 0] as [number, number, number, number, number, number],
  width: 800,
  height: 800,
  backgroundColor: '#ffffff',
  setDimensions: vi.fn(),
  setViewportTransform: vi.fn(),
  renderAll: vi.fn(),
})

let mockCanvas: ReturnType<typeof makeCanvas>
let mockAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn>; style: { display: string } }

beforeEach(() => {
  vi.clearAllMocks()
  mockCanvas = makeCanvas()
  mockAnchor = { href: '', download: '', click: vi.fn(), style: { display: '' } }

  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  })
  vi.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor as unknown as Node)
  vi.spyOn(document.body, 'removeChild').mockReturnValue(mockAnchor as unknown as Node)
  vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
})

describe('exportSVG', () => {
  it('returns ok:true when canvas.toSVG succeeds', () => {
    const result = exportSVG(mockCanvas as never)
    expect(result.ok).toBe(true)
  })

  it('triggers a file download on success', () => {
    exportSVG(mockCanvas as never)
    expect(mockAnchor.download).toBe('noise-portrait.svg')
    expect(mockAnchor.click).toHaveBeenCalledOnce()
  })

  it('returns ok:false when canvas.toSVG throws', () => {
    mockCanvas.toSVG.mockImplementationOnce(() => { throw new Error('SVG failed') })
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

  it('triggers a file download on success', () => {
    exportPNG(mockCanvas as never)
    expect(mockAnchor.download).toBe('noise-portrait.png')
    expect(mockAnchor.click).toHaveBeenCalledOnce()
  })

  it('returns ok:false when toDataURL throws', () => {
    mockCanvas.toDataURL.mockImplementationOnce(() => { throw new Error('PNG failed') })
    const result = exportPNG(mockCanvas as never)
    expect(result.ok).toBe(false)
  })
})

describe('exportPDF', () => {
  it('returns ok:true on success', async () => {
    const result = await exportPDF(mockCanvas as never)
    expect(result.ok).toBe(true)
  })

  it('calls doc.save with the correct filename', async () => {
    await exportPDF(mockCanvas as never)
    const instance = vi.mocked(jspdfModule.jsPDF).mock.instances[0] as unknown as { save: ReturnType<typeof vi.fn> }
    expect(instance.save).toHaveBeenCalledWith('noise-portrait.pdf')
  })

  it('returns ok:false when jsPDF throws', async () => {
    vi.mocked(jspdfModule.jsPDF).mockImplementationOnce(function () {
      throw new Error('PDF failed')
    })
    const result = await exportPDF(mockCanvas as never)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('PDF failed')
  })
})
