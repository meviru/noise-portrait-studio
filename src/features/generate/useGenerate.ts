import { useRef, useCallback, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import {
  useStudioStore,
  selectConfig,
  selectBrightnessMap,
  selectRgbaMap,
  selectBrightnessWidth,
  selectBrightnessHeight,
  RenderState,
} from '@/app/store'
import { renderToFabric } from './renderToFabric'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/shared/constants/canvas.constants'
import type { Canvas } from 'fabric'
import type { WorkerInput, WorkerResult } from '@/entities/stroke-data/StrokeData.types'

interface UseGenerateReturn {
  trigger: (canvasRef: MutableRefObject<Canvas | null>) => void
  cancel: () => void
}

/**
 * Manages the generation web worker lifecycle and exposes trigger/cancel actions.
 * @returns Object with `trigger` to start generation and `cancel` to abort it.
 */
export function useGenerate(): UseGenerateReturn {
  /**
   * Persistent worker instance; reused across renders to avoid re-instantiation cost.
   */
  const workerRef = useRef<Worker | null>(null)
  /**
   * Incremented on every trigger and cancel; stale worker results are dropped when their generation doesn't match.
   */
  const generationRef = useRef(0)

  const config = useStudioStore(selectConfig)
  const brightnessMap = useStudioStore(selectBrightnessMap)
  const rgbaMap = useStudioStore(selectRgbaMap)
  const brightnessWidth = useStudioStore(selectBrightnessWidth)
  const brightnessHeight = useStudioStore(selectBrightnessHeight)
  const setRenderState = useStudioStore((s) => s.setRenderState)
  const setRenderProgress = useStudioStore((s) => s.setRenderProgress)

  /**
   * Lazily creates the generate worker on first call; returns the existing instance on subsequent calls.
   * @returns The active `Worker` instance.
   */
  function getWorker(): Worker {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./generateWorker.ts', import.meta.url), {
        type: 'module',
      })
    }
    return workerRef.current
  }

  /**
   * Serializes config and brightness data, posts to the worker, and handles rendering the result.
   * @param canvasRef - Ref to the Fabric canvas that will receive the rendered output.
   */
  const trigger = useCallback(
    (canvasRef: MutableRefObject<Canvas | null>) => {
      if (!brightnessMap || !canvasRef.current) return

      const myGeneration = ++generationRef.current
      setRenderState(RenderState.Computing)
      setRenderProgress(0)

      const worker = getWorker()

      worker.onmessage = async (e: MessageEvent<WorkerResult>) => {
        if (e.data.generation !== generationRef.current) return

        setRenderState(RenderState.Rendering)

        try {
          await renderToFabric(
            canvasRef.current!,
            e.data.payload,
            config,
            brightnessMap,
            rgbaMap,
            brightnessWidth,
            brightnessHeight,
            (pct) => setRenderProgress(pct)
          )
          setRenderState(RenderState.Done)
        } catch (err) {
          if (import.meta.env.DEV) console.error('[renderToFabric error]', err)
          setRenderState(RenderState.Error)
        }
      }

      worker.onerror = (e: ErrorEvent) => {
        if (import.meta.env.DEV) console.error('[Worker error]', e.message)
        setRenderState(RenderState.Error)
      }

      const bufferClone = brightnessMap.buffer.slice(0) as ArrayBuffer

      const message: WorkerInput = {
        config: {
          technique: config.technique,
          canvasWidth: CANVAS_WIDTH,
          canvasHeight: CANVAS_HEIGHT,
          density: config.density,
          minSize: config.minSize,
          maxSize: config.maxSize,
          strokeLength: config.strokeLength,
          contourLevels: config.contourLevels,
          crosshatchLayers: config.crosshatchLayers,
          scanlineAmplitude: config.scanlineAmplitude,
          strandLength: config.strandLength,
          seed: config.seed,
        },
        brightnessBuffer: bufferClone,
        brightnessWidth,
        brightnessHeight,
        generation: myGeneration,
      }

      try {
        worker.postMessage(message, [bufferClone])
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Worker postMessage error]', err)
        setRenderState(RenderState.Error)
      }
    },
    [config, brightnessMap, rgbaMap, brightnessWidth, brightnessHeight, setRenderState, setRenderProgress]
  )

  /**
   * Abandons the in-flight generation by bumping the generation counter and resetting render state.
   */
  const cancel = useCallback(() => {
    generationRef.current++
    setRenderState(RenderState.Idle)
    setRenderProgress(0)
  }, [setRenderState, setRenderProgress])

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  return { trigger, cancel }
}
