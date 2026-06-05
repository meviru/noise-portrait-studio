import type { Canvas } from 'fabric'
import type { Result } from '@/entities/export-options/ExportOptions.types'
import { EXPORT_MULTIPLIER, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/shared/constants/canvas.constants'
import { withCleanViewport } from './exportUtils'

const PAGE_PADDING_PT = 20

export async function exportPDF(canvas: Canvas): Promise<Result<void>> {
  try {
    const { jsPDF } = await import('jspdf')

    const dataURL = withCleanViewport(canvas, () => {
      // Use pure white for the PDF background so it prints cleanly.
      // The canvas backgroundColor is #f5f5f5 (off-white) which reads as gray
      // in PDF viewers — replacing it with #ffffff removes that tint.
      const savedBg = canvas.backgroundColor
      canvas.backgroundColor = '#ffffff'
      try {
        return canvas.toDataURL({ format: 'jpeg', quality: 0.95, multiplier: EXPORT_MULTIPLIER })
      } finally {
        canvas.backgroundColor = savedBg
      }
    })

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a3' })

    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT
    const availW = pageW - PAGE_PADDING_PT * 2
    const availH = pageH - PAGE_PADDING_PT * 2

    let imgW: number
    let imgH: number
    if (canvasAspect > availW / availH) {
      imgW = availW
      imgH = availW / canvasAspect
    } else {
      imgH = availH
      imgW = availH * canvasAspect
    }

    const x = (pageW - imgW) / 2
    const y = (pageH - imgH) / 2

    doc.addImage(dataURL, 'JPEG', x, y, imgW, imgH, '', 'FAST')
    doc.save('noise-portrait.pdf')

    return { ok: true, value: undefined }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'PDF export failed' }
  }
}
