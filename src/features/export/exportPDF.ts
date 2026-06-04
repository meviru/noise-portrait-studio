import type { Canvas } from 'fabric'
import type { Result } from '@/entities/export-options/ExportOptions.types'
import { EXPORT_MULTIPLIER } from '@/shared/constants/canvas.constants'

export async function exportPDF(canvas: Canvas): Promise<Result<void>> {
  try {
    const { jsPDF } = await import('jspdf')

    const dataURL = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.95,
      multiplier: EXPORT_MULTIPLIER,
    })

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a3',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.addImage(dataURL, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST')
    doc.save('noise-portrait.pdf')

    return { ok: true, value: undefined }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'PDF export failed' }
  }
}
