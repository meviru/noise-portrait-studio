import { useRef } from 'react'
import type { Canvas } from 'fabric'
import { Sidebar } from '@/widgets/sidebar/Sidebar'
import { CanvasPanel } from '@/widgets/canvas-panel/CanvasPanel'
import { MobileNav } from '@/widgets/mobile-nav/MobileNav'

/**
 * Root studio page — composes the desktop sidebar, the full-screen canvas panel,
 * and the mobile bottom navigation into a single layout.
 */
export default function StudioPage() {
  /**
   * Shared Fabric.js canvas instance passed down to both the canvas panel and floating controls.
   */
  const canvasRef = useRef<Canvas | null>(null)

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <Sidebar />
      <div className="flex flex-1 min-w-0 pb-14 md:pb-0">
        <CanvasPanel canvasRef={canvasRef} />
      </div>
      <MobileNav />
    </div>
  )
}
