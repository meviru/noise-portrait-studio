import { PresetGrid } from './PresetGrid'
import { ParameterPanel } from './ParameterPanel'
import { PalettePicker } from './PalettePicker'
import { DropZone } from '@/shared/ui/DropZone'
import { useImageUpload } from '@/features/image-upload/useImageUpload'
import { useStudioStore } from '@/app/store'
import { STRINGS } from '@/shared/constants/strings'

/**
 * Uppercase section label used to group sidebar controls.
 */
function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-[10px] tracking-widest uppercase font-medium text-neutral-500">{label}</h3>
  )
}

/**
 * Horizontal rule separating sidebar sections.
 */
function Divider() {
  return <div className="h-px bg-neutral-800" />
}

/**
 * Desktop sidebar containing photo upload, presets, render parameters, and palette controls.
 */
export function Sidebar() {
  const { handleFile, isProcessing, error, clearError } = useImageUpload()
  const imageDataURL = useStudioStore((s) => s.imageDataURL)
  const hasImage = imageDataURL !== null

  return (
    <aside className="hidden md:flex flex-col w-72 shrink-0 h-full bg-neutral-900 border-r border-neutral-800 overflow-y-auto">
      <div className="px-4 py-3 border-b bg-neutral-900 border-neutral-800 shrink-0">
        <span className="text-[10px] tracking-widest uppercase font-semibold text-neutral-500">
          Noise Portrait Studio
        </span>
      </div>
      <div className="flex flex-col gap-4 p-3">
        <section className="flex flex-col gap-2">
          <SectionHeader label="Photo" />
          <DropZone
            onFile={handleFile}
            isProcessing={isProcessing}
            error={error}
            hasImage={hasImage}
            imageDataURL={imageDataURL}
          />
          {error && (
            <button onClick={clearError} className="text-[10px] text-neutral-600 underline text-left cursor-pointer">
              Dismiss
            </button>
          )}
        </section>

        <Divider />

        <section className="flex flex-col gap-2">
          <SectionHeader label={STRINGS.sidebar.presets} />
          <PresetGrid />
        </section>

        <Divider />

        <section className="flex flex-col gap-2">
          <SectionHeader label={STRINGS.sidebar.parameters} />
          <ParameterPanel />
        </section>

        <Divider />

        <section className="flex flex-col gap-2">
          <SectionHeader label={STRINGS.sidebar.palette} />
          <PalettePicker />
        </section>
      </div>
    </aside>
  )
}
