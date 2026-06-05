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
