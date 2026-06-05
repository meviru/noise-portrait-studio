import { motion, AnimatePresence } from 'framer-motion'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { useStudioStore, selectRenderState, selectRenderProgress, RenderState } from '@/app/store'
import { STRINGS } from '@/shared/constants/strings'

/**
 * Renders the progress bar and animated status badge over the canvas during and after generation.
 */
export function CanvasOverlay() {
  const renderState = useStudioStore(selectRenderState)
  const progress = useStudioStore(selectRenderProgress)

  const isActive = renderState === RenderState.Computing || renderState === RenderState.Rendering
  const statusText = STRINGS.renderState[renderState]

  return (
    <>
      <ProgressBar value={progress} visible={isActive} />

      <AnimatePresence>
        {renderState === RenderState.Error && (
          <motion.div
            key="error-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-950/40 flex items-center justify-center z-20"
          >
            <span className="text-sm text-red-300">{statusText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {renderState !== RenderState.Idle && (
          <motion.div
            key="status-badge"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded-full bg-black/60 text-[10px] text-neutral-400"
          >
            {statusText}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
