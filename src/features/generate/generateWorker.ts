import { generateStipple } from '@/shared/lib/techniques/stipple'
import { generateHatch } from '@/shared/lib/techniques/hatch'
import { generateContour } from '@/shared/lib/techniques/contour'
import { generateCrosshatch } from '@/shared/lib/techniques/crosshatch'
import { generateHalftone } from '@/shared/lib/techniques/halftone'
import { generateScanline } from '@/shared/lib/techniques/scanline'
import { generateFlowStrands } from '@/shared/lib/techniques/flowStrands'
import { generateConcentricRings } from '@/shared/lib/techniques/concentricRings'
import type { WorkerInput, WorkerResult } from '@/entities/stroke-data/StrokeData.types'
import { TechniqueId } from '@/shared/constants/shared.constant'

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { config, brightnessBuffer, brightnessWidth, brightnessHeight, generation } = e.data
  const brightnessMap = new Float32Array(brightnessBuffer)

  let result: WorkerResult

  switch (config.technique) {
    case TechniqueId.Stipple: {
      const items = generateStipple(
        {
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          density: config.density,
          minSize: config.minSize,
          maxSize: config.maxSize,
          seed: config.seed,
        },
        brightnessMap,
        brightnessWidth,
        brightnessHeight
      )
      result = { payload: { type: 'dots', items }, generation }
      break
    }

    case TechniqueId.Hatch: {
      const items = generateHatch(
        {
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          density: config.density,
          strokeLength: config.strokeLength,
          minSize: config.minSize,
          maxSize: config.maxSize,
        },
        brightnessMap,
        brightnessWidth,
        brightnessHeight
      )
      result = { payload: { type: 'strokes', items }, generation }
      break
    }

    case TechniqueId.Contour: {
      const items = generateContour(
        {
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          contourLevels: config.contourLevels,
          minSize: config.minSize,
        },
        brightnessMap,
        brightnessWidth,
        brightnessHeight
      )
      result = { payload: { type: 'strokes', items }, generation }
      break
    }

    case TechniqueId.Crosshatch: {
      const items = generateCrosshatch(
        {
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          density: config.density,
          strokeLength: config.strokeLength,
          minSize: config.minSize,
          maxSize: config.maxSize,
          layers: config.crosshatchLayers,
        },
        brightnessMap,
        brightnessWidth,
        brightnessHeight
      )
      result = { payload: { type: 'strokes', items }, generation }
      break
    }

    case TechniqueId.Halftone: {
      const items = generateHalftone(
        {
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          density: config.density,
          minSize: config.minSize,
          maxSize: config.maxSize,
        },
        brightnessMap,
        brightnessWidth,
        brightnessHeight
      )
      result = { payload: { type: 'dots', items }, generation }
      break
    }

    case TechniqueId.Scanline: {
      const items = generateScanline(
        {
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          density: config.density,
          strokeLength: config.strokeLength,
          minSize: config.minSize,
          scanlineAmplitude: config.scanlineAmplitude,
        },
        brightnessMap,
        brightnessWidth,
        brightnessHeight
      )
      result = { payload: { type: 'strokes', items }, generation }
      break
    }

    case TechniqueId.ConcentricRings: {
      const items = generateConcentricRings(
        {
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          density: config.density,
          minSize: config.minSize,
          maxSize: config.maxSize,
        },
        brightnessMap,
        brightnessWidth,
        brightnessHeight
      )
      result = { payload: { type: 'strokes', items }, generation }
      break
    }

    case TechniqueId.FlowStrands: {
      const items = generateFlowStrands(
        {
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          density: config.density,
          strandLength: config.strandLength,
          minSize: config.minSize,
          maxSize: config.maxSize,
          seed: config.seed,
        },
        brightnessMap,
        brightnessWidth,
        brightnessHeight
      )
      result = { payload: { type: 'paths', items }, generation }
      break
    }
  }

  self.postMessage(result)
}
