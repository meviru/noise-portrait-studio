import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent, KeyboardEvent } from 'react'
import { IconCloudUpload, IconPhotoEdit } from '@tabler/icons-react'
import { STRINGS } from '@/shared/constants/strings'

interface DropZoneProps {
  onFile: (file: File) => void
  isProcessing: boolean
  error: string | null
  hasImage: boolean
  imageDataURL: string | null
}

/**
 * Click/drag-and-drop upload area; shows a thumbnail preview once an image is loaded.
 */
export function DropZone({ onFile, isProcessing, error, hasImage, imageDataURL }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Programmatically opens the hidden file input dialog.
   */
  function openDialog() {
    inputRef.current?.click()
  }

  /**
   * Handles a drag-and-drop file onto the zone.
   * @param e - The drag event from the drop target.
   */
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  /**
   * Handles file selection via the hidden input.
   * @param e - The change event from the file input.
   */
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  /**
   * Opens the file dialog when Enter or Space is pressed for keyboard accessibility.
   * @param e - The keyboard event from the drop zone div.
   */
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openDialog()
    }
  }

  const borderClass = error
    ? 'border-red-800'
    : isDragging
      ? 'border-primary-500'
      : 'border-neutral-700'

  if (hasImage && imageDataURL) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={STRINGS.upload.replace}
        className="relative w-full aspect-square cursor-pointer rounded overflow-hidden group"
        onClick={openDialog}
        onKeyDown={handleKeyDown}
      >
        <img src={imageDataURL} alt="Uploaded photo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconPhotoEdit size={20} className="text-white" aria-hidden="true" />
          <span className="text-xs text-white font-medium">{STRINGS.upload.replace}</span>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} tabIndex={-1} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload photo"
        className={`w-full aspect-square rounded border-2 border-dashed ${borderClass} flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
        onClick={openDialog}
        onKeyDown={handleKeyDown}
        onDragEnter={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false) }}
        onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="w-4 h-4 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
        ) : (
          <>
            <IconCloudUpload size={24} className="text-neutral-500" aria-hidden="true" />
            <span className="text-xs text-neutral-400 text-center">{STRINGS.upload.instruction}</span>
            <span className="text-[10px] text-neutral-600">{STRINGS.upload.subInstruction}</span>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-[10px] text-red-400">
          {error}
        </p>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} tabIndex={-1} />
    </div>
  )
}
