import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { DropZone } from '@/shared/ui/DropZone'
import { useImageUpload } from '@/features/image-upload/useImageUpload'
import { useStudioStore } from '@/app/store'
import { PresetGrid } from '@/widgets/sidebar/PresetGrid'
import { ParameterPanel } from '@/widgets/sidebar/ParameterPanel'
import { PalettePicker } from '@/widgets/sidebar/PalettePicker'
import { type TabId, TABS } from './utility/constants/mobile-nav.constant'

export function MobileNav() {
  const [activeTab, setActiveTab] = useState<TabId | null>(null)
  const { handleFile, isProcessing, error, clearError } = useImageUpload()
  const imageDataURL = useStudioStore((s) => s.imageDataURL)
  const hasImage = imageDataURL !== null

  function handleTabPress(id: TabId) {
    setActiveTab((prev) => (prev === id ? null : id))
  }

  const activeTabData = TABS.find((t) => t.id === activeTab)

  return (
    <div className="md:hidden">
      {/* Tab content panel */}
      {activeTab !== null && (
        <div className="fixed inset-x-0 bottom-14 z-40 bg-neutral-900 border-t border-neutral-800 flex flex-col max-h-[65vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
            <span className="text-[10px] tracking-widest uppercase font-medium text-neutral-500">
              {activeTabData?.panelLabel}
            </span>
            <button
              onClick={() => setActiveTab(null)}
              className="text-neutral-500 hover:text-neutral-300 transition-colors p-0.5 cursor-pointer"
              aria-label="Close panel"
            >
              <IconX size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="flex flex-col gap-4 p-4">
              {activeTab === 'photo' && (
                <>
                  <DropZone
                    onFile={handleFile}
                    isProcessing={isProcessing}
                    error={error}
                    hasImage={hasImage}
                    imageDataURL={imageDataURL}
                  />
                  {error && (
                    <button
                      onClick={clearError}
                      className="text-[10px] text-neutral-600 underline text-left cursor-pointer"
                    >
                      Dismiss
                    </button>
                  )}
                </>
              )}
              {activeTab === 'preset' && <PresetGrid />}
              {activeTab === 'parameters' && <ParameterPanel />}
              {activeTab === 'palette' && <PalettePicker />}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 h-14 bg-neutral-900 border-t border-neutral-800 flex">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => handleTabPress(id)}
            aria-pressed={activeTab === id}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === id ? 'text-primary-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
            <span className="text-[10px] tracking-wide">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
