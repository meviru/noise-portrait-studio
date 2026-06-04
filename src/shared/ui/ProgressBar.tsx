import { motion, AnimatePresence } from 'framer-motion'

interface ProgressBarProps {
  value: number
  visible: boolean
}

export function ProgressBar({ value, visible }: ProgressBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(value)}
          className="absolute top-0 left-0 right-0 h-0.5 bg-neutral-800 z-10"
        >
          <motion.div
            className="h-full bg-primary-600"
            animate={{ width: `${value}%` }}
            transition={{ ease: 'linear', duration: 0.1 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
