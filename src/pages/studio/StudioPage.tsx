import { useRef } from 'react'
import type { Canvas } from 'fabric'
import { Sidebar } from '@/widgets/sidebar/Sidebar'
import { CanvasPanel } from '@/widgets/canvas-panel/CanvasPanel'
import { MobileNav } from '@/widgets/mobile-nav/MobileNav'

export default function StudioPage() {
  const canvasRef = useRef<Canvas | null>(null)

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 pb-14 md:pb-0">
        <CanvasPanel canvasRef={canvasRef} />
      </div>
      <MobileNav />
    </div>
  )
}
