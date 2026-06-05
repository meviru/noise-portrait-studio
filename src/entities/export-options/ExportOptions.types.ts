import { ExportFormat } from '@/shared/constants/shared.constant'
export { ExportFormat }

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E }
