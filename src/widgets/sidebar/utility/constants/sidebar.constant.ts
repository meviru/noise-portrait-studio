import { ColorMode } from '@/entities/noise-config/utility/constants/noise-config.constant'
export { ColorMode }

export const PALETTE_LABELS = [
  'Charcoal', 'Slate', 'Amethyst', 'Forest',
  'Sienna', 'Navy', 'Espresso', 'Midnight',
]

export const MONO_COLORS: Array<{ hex: string; label: string }> = [
  { hex: '#1a1a1a', label: 'Ink Black' },
  { hex: '#4a4a4a', label: 'Dark Gray' },
  { hex: '#6b4226', label: 'Sepia' },
  { hex: '#1a2a4a', label: 'Indigo' },
  { hex: '#f0f0f0', label: 'White' },
  { hex: '#f5e6c8', label: 'Parchment' },
]

export const COLOR_MODES: Array<{ id: ColorMode; label: string }> = [
  { id: ColorMode.Mono, label: 'Mono' },
  { id: ColorMode.Photo, label: 'Photo' },
  { id: ColorMode.Palette, label: 'Palette' },
]
