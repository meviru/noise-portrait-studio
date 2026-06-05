import { TechniqueId, PayloadType } from '@/shared/constants/shared.constant'
export { TechniqueId, PayloadType }

// Kept for existing noise-engine unit tests
export interface PathPoint { x: number; y: number }
export type GeneratedPath = PathPoint[]

// New output types for image-driven techniques
export interface DotItem { x: number; y: number; r: number }
export interface StrokeItem { x1: number; y1: number; x2: number; y2: number; weight: number }
export interface TriangleItem {
  a: { x: number; y: number }
  b: { x: number; y: number }
  c: { x: number; y: number }
}
export interface RectItem { x: number; y: number; w: number; h: number }
export interface CharItem { x: number; y: number; char: string }

export type WorkerPayload =
  | { type: PayloadType.Dots; items: DotItem[] }
  | { type: PayloadType.Strokes; items: StrokeItem[] }
  | { type: PayloadType.Paths; items: GeneratedPath[] }
  | { type: PayloadType.Polys; items: TriangleItem[] }
  | { type: PayloadType.Rects; items: RectItem[] }
  | { type: PayloadType.Chars; items: CharItem[] }

export interface WorkerRenderConfig {
  technique: TechniqueId
  canvasWidth: number
  canvasHeight: number
  density: number
  minSize: number
  maxSize: number
  strokeLength: number
  contourLevels: number
  crosshatchLayers: number
  scanlineAmplitude: number
  strandLength: number
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
