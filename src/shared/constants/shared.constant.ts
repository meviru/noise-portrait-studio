/**
 * Rendering technique applied to the brightness map.
 */
export enum TechniqueId {
  Stipple = 'stipple',
  Hatch = 'hatch',
  Contour = 'contour',
  Crosshatch = 'crosshatch',
  Halftone = 'halftone',
  Scanline = 'scanline',
  FlowStrands = 'flow-strands',
  ConcentricRings = 'concentric-rings',
  LowPoly = 'low-poly',
  Mosaic = 'mosaic',
  Ascii = 'ascii',
}

/**
 * Discriminant tag on WorkerPayload — identifies the item array's element type.
 */
export enum PayloadType {
  Dots = 'dots',
  Strokes = 'strokes',
  Paths = 'paths',
  Polys = 'polys',
  Rects = 'rects',
  Chars = 'chars',
}

/**
 * Color source used when drawing each rendered element.
 */
export enum ColorMode {
  Mono = 'mono',
  Photo = 'photo',
  Palette = 'palette',
}

/**
 * Supported file formats for canvas export.
 */
export enum ExportFormat {
  SVG = 'svg',
  PNG = 'png',
  PDF = 'pdf',
}

/**
 * All possible states of the generation pipeline.
 */
export enum RenderState {
  Idle = 'idle',
  Computing = 'computing',
  Rendering = 'rendering',
  Done = 'done',
  Error = 'error',
}

/**
 * Full configuration passed to the generation pipeline and Fabric renderer.
 */
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

  // Scanline
  scanlineAmplitude: number // max vertical deflection in px

  // Flow Strands
  strandLength: number // integration steps per direction

  // Stipple randomness
  seed: number
}

/**
 * Baseline render configuration applied on first load and preset reset.
 */
export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  technique: TechniqueId.Stipple,
  density: 2000,
  minSize: 1.0,
  maxSize: 5.0,
  opacity: 0.9,
  colorMode: ColorMode.Mono,
  monoColor: '#1a1a1a',
  paletteIndex: 0,
  strokeLength: 22,
  contourLevels: 8,
  crosshatchLayers: 2,
  scanlineAmplitude: 20,
  strandLength: 60,
  seed: 4217,
}

/**
 * A named technique preset with display metadata and config overrides.
 */
export interface Preset {
  id: TechniqueId
  label: string
  description: string
  overrides: Partial<Omit<RenderConfig, 'colorMode' | 'monoColor' | 'paletteIndex'>>
}

/**
 * All built-in technique presets.
 */
export const PRESETS: Preset[] = [
  {
    id: TechniqueId.Stipple,
    label: 'Stipple',
    description: 'Dot cloud - dense in shadows, sparse in highlights',
    overrides: {
      technique: TechniqueId.Stipple,
      density: 2000,
      minSize: 1.0,
      maxSize: 5.0,
      opacity: 0.9,
      seed: 4217,
    },
  },
  {
    id: TechniqueId.Hatch,
    label: 'Hatching',
    description: 'Short strokes following contours - pencil sketch look',
    overrides: {
      technique: TechniqueId.Hatch,
      density: 1500,
      minSize: 0.6,
      maxSize: 2.2,
      opacity: 0.85,
      strokeLength: 22,
    },
  },
  {
    id: TechniqueId.Contour,
    label: 'Contour',
    description: 'Iso-brightness curves - topographic map of the face',
    overrides: {
      technique: TechniqueId.Contour,
      contourLevels: 8,
      minSize: 1.0,
      maxSize: 1.0,
      opacity: 0.9,
    },
  },
  {
    id: TechniqueId.Crosshatch,
    label: 'Crosshatch',
    description: 'Layered strokes at multiple angles - engraving style',
    overrides: {
      technique: TechniqueId.Crosshatch,
      density: 2000,
      minSize: 0.5,
      maxSize: 1.8,
      opacity: 0.8,
      strokeLength: 20,
      crosshatchLayers: 3,
    },
  },
  {
    id: TechniqueId.Halftone,
    label: 'Halftone',
    description: 'Staggered dot grid - offset print / CMYK press look',
    overrides: {
      technique: TechniqueId.Halftone,
      density: 1500,
      minSize: 0.5,
      maxSize: 6.5,
      opacity: 1.0,
    },
  },
  {
    id: TechniqueId.Scanline,
    label: 'Scanline',
    description: 'Horizontal lines that ripple with image brightness',
    overrides: {
      technique: TechniqueId.Scanline,
      density: 80,
      minSize: 0.8,
      strokeLength: 6,
      scanlineAmplitude: 22,
      opacity: 0.95,
    },
  },
  {
    id: TechniqueId.FlowStrands,
    label: 'Flow Strands',
    description: 'Curves flowing along brightness contours - pencil sketch look',
    overrides: {
      technique: TechniqueId.FlowStrands,
      density: 400,
      minSize: 0.7,
      maxSize: 2.0,
      strandLength: 80,
      opacity: 0.85,
      seed: 3141,
    },
  },
  {
    id: TechniqueId.ConcentricRings,
    label: 'Rings',
    description: 'Concentric arcs — thick in shadows, vanishing in highlights',
    overrides: {
      technique: TechniqueId.ConcentricRings,
      density: 70,
      minSize: 0.3,
      maxSize: 4.5,
      opacity: 0.9,
    },
  },
  {
    id: TechniqueId.LowPoly,
    label: 'Low Poly',
    description: 'Delaunay triangles — faceted crystal portrait with finer detail at edges',
    overrides: {
      technique: TechniqueId.LowPoly,
      density: 600,
      opacity: 1.0,
      seed: 4217,
    },
  },
  {
    id: TechniqueId.Mosaic,
    label: 'Mosaic',
    description: 'Solid colour tiles — Roman mosaic / pixel-art portrait',
    overrides: {
      technique: TechniqueId.Mosaic,
      density: 60,
      opacity: 1.0,
    },
  },
  {
    id: TechniqueId.Ascii,
    label: 'ASCII Art',
    description: 'Character map — brightness mapped to text symbols',
    overrides: {
      technique: TechniqueId.Ascii,
      density: 50,
      opacity: 0.95,
    },
  },
]
