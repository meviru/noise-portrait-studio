import { PresetGrid } from './PresetGrid'
import { ParameterPanel } from './ParameterPanel'
import { PalettePicker } from './PalettePicker'
import { DropZone } from '@/shared/ui/DropZone'
import { useImageUpload } from '@/features/image-upload/useImageUpload'
import { useStudioStore } from '@/app/store'
import { STRINGS } from '@/shared/constants/strings'

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-[10px] tracking-widest uppercase font-medium text-neutral-500">{label}</h3>
  )
}

function Divider() {
  return <div className="h-px bg-neutral-800" />
}

export function Sidebar() {
  const { handleFile, isProcessing, error, clearError } = useImageUpload()
  const imageDataURL = useStudioStore((s) => s.imageDataURL)
  const hasImage = imageDataURL !== null

  return (
    <aside className="hidden md:flex flex-col w-55 shrink-0 h-full bg-neutral-900 border-r border-neutral-800 overflow-y-auto">
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
            <button onClick={clearError} className="text-[10px] text-neutral-600 underline text-left">
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
