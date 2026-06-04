import { useRef, useCallback, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import {
  useStudioStore,
  selectConfig,
  selectBrightnessMap,
  selectRgbaMap,
  selectBrightnessWidth,
  selectBrightnessHeight,
} from '@/app/store'
import { renderToFabric } from './renderToFabric'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/shared/constants/canvas.constants'
import type { Canvas } from 'fabric'
import type { WorkerInput, WorkerResult } from '@/entities/stroke-data/StrokeData.types'

interface UseGenerateReturn {
  trigger: (canvasRef: MutableRefObject<Canvas | null>) => void
  cancel: () => void
}

export function useGenerate(): UseGenerateReturn {
  const workerRef = useRef<Worker | null>(null)
  const generationRef = useRef(0)

  const config = useStudioStore(selectConfig)
  const brightnessMap = useStudioStore(selectBrightnessMap)
  const rgbaMap = useStudioStore(selectRgbaMap)
  const brightnessWidth = useStudioStore(selectBrightnessWidth)
  const brightnessHeight = useStudioStore(selectBrightnessHeight)
  const setRenderState = useStudioStore((s) => s.setRenderState)
  const setRenderProgress = useStudioStore((s) => s.setRenderProgress)

  function getWorker(): Worker {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./generateWorker.ts', import.meta.url), {
        type: 'module',
      })
    }
    return workerRef.current
  }

  const trigger = useCallback(
    (canvasRef: MutableRefObject<Canvas | null>) => {
      if (!brightnessMap || !canvasRef.current) return

      const myGeneration = ++generationRef.current
      setRenderState('computing')
      setRenderProgress(0)

      const worker = getWorker()

      worker.onmessage = async (e: MessageEvent<WorkerResult>) => {
        if (e.data.generation !== generationRef.current) return

        setRenderState('rendering')

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
          setRenderState('done')
        } catch (err) {
          if (import.meta.env.DEV) console.error('[renderToFabric error]', err)
          setRenderState('error')
        }
      }

      worker.onerror = (e: ErrorEvent) => {
        if (import.meta.env.DEV) console.error('[Worker error]', e.message)
        setRenderState('error')
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
        setRenderState('error')
      }
    },
    [config, brightnessMap, rgbaMap, brightnessWidth, brightnessHeight, setRenderState, setRenderProgress]
  )

  const cancel = useCallback(() => {
    generationRef.current++
    setRenderState('idle')
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
