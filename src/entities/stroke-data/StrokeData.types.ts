// Kept for existing noise-engine unit tests
export interface PathPoint { x: number; y: number }
export type GeneratedPath = PathPoint[]

// New output types for image-driven techniques
export interface DotItem { x: number; y: number; r: number }
export interface StrokeItem { x1: number; y1: number; x2: number; y2: number; weight: number }

export type WorkerPayload =
  | { type: 'dots'; items: DotItem[] }
  | { type: 'strokes'; items: StrokeItem[] }

export interface WorkerRenderConfig {
  technique: 'stipple' | 'hatch' | 'contour' | 'crosshatch'
  canvasWidth: number
  canvasHeight: number
  density: number
  minSize: number
  maxSize: number
  strokeLength: number
  contourLevels: number
  crosshatchLayers: number
  seed: number
}

export interface WorkerInput {
  config: WorkerRenderConfig
  brightnessBuffer: ArrayBuffer
  brightnessWidth: number
  brightnessHeight: number
  generation: number
}

export interface WorkerResult {
  payload: WorkerPayload
  generation: number
}

// Legacy — kept for existing tests and generateWorker fallback
export interface FlowFieldConfig {
  width: number
  height: number
  noiseScale: number
  octaves: number
  stepLength: number
  stepCount: number
  particleCount: number
  maxStrokeWeight: number
  minStrokeWeight: number
  seed: number
}
