export type ExportFormat = 'svg' | 'png' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  multiplier: number
}

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E }
