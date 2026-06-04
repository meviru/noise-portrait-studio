export type TechniqueId = 'stipple' | 'hatch' | 'contour' | 'crosshatch'
export type ColorMode = 'mono' | 'photo' | 'palette'

// Kept as alias so existing imports of PresetId still compile
export type PresetId = TechniqueId

export interface RenderConfig {
  technique: TechniqueId

  // Universal
  density: number        // how many elements (dots / stroke origins)
  minSize: number        // min dot radius or stroke weight
  maxSize: number        // max dot radius or stroke weight
  opacity: number        // 0.1–1.0

  // Color
  colorMode: ColorMode
  monoColor: string      // hex — used when colorMode === 'mono'
  paletteIndex: number   // used when colorMode === 'palette'

  // Hatch / Crosshatch
  strokeLength: number   // px length of each stroke

  // Contour
  contourLevels: number  // 4–12 iso-brightness levels

  // Crosshatch
  crosshatchLayers: number // 2 or 3

  // Stipple randomness
  seed: number
}

// Legacy alias — kept so Phase 1 tests referencing NoiseConfig still compile
export type NoiseConfig = RenderConfig
