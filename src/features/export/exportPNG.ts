import type { Canvas } from 'fabric'
import type { Result } from '@/entities/export-options/ExportOptions.types'
import { EXPORT_MULTIPLIER } from '@/shared/constants/canvas.constants'
import { withCleanViewport } from './exportUtils'

function dataURLToBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',')
  const mimeMatch = header?.match(/:(.*?);/)
  const mime = mimeMatch?.[1] ?? 'image/png'
  const binary = atob(data ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function exportPNG(canvas: Canvas): Result<void> {
  try {
    // Reset to logical 800×800 so the exported pixels are the full art with no offset
    const dataURL = withCleanViewport(canvas, () =>
      canvas.toDataURL({ format: 'png', multiplier: EXPORT_MULTIPLIER, quality: 1 })
    )
    const blob = dataURLToBlob(dataURL)
    const url = URL.createObjectURL(blob)
    triggerDownload(url, 'noise-portrait.png')
    URL.revokeObjectURL(url)
    return { ok: true, value: undefined }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'PNG export failed' }
  }
}
