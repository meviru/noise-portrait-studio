import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { DEFAULT_RENDER_CONFIG } from '@/entities/noise-config/NoiseConfig.defaults'
import type { RenderConfig, TechniqueId } from '@/entities/noise-config/NoiseConfig.types'

export type RenderState = 'idle' | 'computing' | 'rendering' | 'done' | 'error'

interface StudioStore {
  // Image slice
  imageDataURL: string | null
  brightnessMap: Float32Array | null
  rgbaMap: Uint8ClampedArray | null
  brightnessWidth: number
  brightnessHeight: number
  setImage: (
    dataURL: string,
    map: Float32Array,
    rgbaMap: Uint8ClampedArray,
    width: number,
    height: number
  ) => void
  clearImage: () => void

  // Config slice
  config: RenderConfig
  setConfig: (partial: Partial<RenderConfig>) => void
  resetConfig: () => void

  // Active technique (preset) slice
  activePreset: TechniqueId
  setPreset: (id: TechniqueId) => void

  // Render state slice
  renderState: RenderState
  renderProgress: number
  setRenderState: (s: RenderState) => void
  setRenderProgress: (n: number) => void
}

export const useStudioStore = create<StudioStore>()(
  immer((set) => ({
    imageDataURL: null,
    brightnessMap: null,
    rgbaMap: null,
    brightnessWidth: 0,
    brightnessHeight: 0,
    setImage: (dataURL, map, rgbaMap, width, height) =>
      set((state) => {
        state.imageDataURL = dataURL
        state.brightnessMap = map
        state.rgbaMap = rgbaMap
        state.brightnessWidth = width
        state.brightnessHeight = height
      }),
    clearImage: () =>
      set((state) => {
        state.imageDataURL = null
        state.brightnessMap = null
        state.rgbaMap = null
        state.brightnessWidth = 0
        state.brightnessHeight = 0
      }),

    config: { ...DEFAULT_RENDER_CONFIG },
    setConfig: (partial) =>
      set((state) => {
        Object.assign(state.config, partial)
      }),
    resetConfig: () =>
      set((state) => {
        state.config = { ...DEFAULT_RENDER_CONFIG }
      }),

    activePreset: 'stipple',
    setPreset: (id) =>
      set((state) => {
        state.activePreset = id
      }),

    renderState: 'idle',
    renderProgress: 0,
    setRenderState: (s) =>
      set((state) => {
        state.renderState = s
      }),
    setRenderProgress: (n) =>
      set((state) => {
        state.renderProgress = n
      }),
  }))
)

// Stable selectors
export const selectConfig = (s: StudioStore) => s.config
export const selectRenderState = (s: StudioStore) => s.renderState
export const selectRenderProgress = (s: StudioStore) => s.renderProgress
export const selectActivePreset = (s: StudioStore) => s.activePreset
export const selectImageDataURL = (s: StudioStore) => s.imageDataURL
export const selectBrightnessMap = (s: StudioStore) => s.brightnessMap
export const selectRgbaMap = (s: StudioStore) => s.rgbaMap
export const selectBrightnessWidth = (s: StudioStore) => s.brightnessWidth
export const selectBrightnessHeight = (s: StudioStore) => s.brightnessHeight
