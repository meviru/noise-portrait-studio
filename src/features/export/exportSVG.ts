import type { Canvas } from 'fabric'
import type { Result } from '@/entities/export-options/ExportOptions.types'

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function exportSVG(canvas: Canvas): Result<void> {
  try {
    const svgString = canvas.toSVG()
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, 'noise-portrait.svg')
    URL.revokeObjectURL(url)
    return { ok: true, value: undefined }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SVG export failed' }
  }
}
