import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent, KeyboardEvent } from 'react'
import { STRINGS } from '@/shared/constants/strings'

interface DropZoneProps {
  onFile: (file: File) => void
  isProcessing: boolean
  error: string | null
  hasImage: boolean
  imageDataURL: string | null
}

export function DropZone({ onFile, isProcessing, error, hasImage, imageDataURL }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function openDialog() {
    inputRef.current?.click()
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openDialog()
    }
  }

  const borderClass = error
    ? 'border-red-800'
    : isDragging
      ? 'border-violet-500'
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
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-white font-medium">{STRINGS.upload.replace}</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          tabIndex={-1}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload photo"
        className={`w-full aspect-square rounded border-2 border-dashed ${borderClass} flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
        onClick={openDialog}
        onKeyDown={handleKeyDown}
        onDragEnter={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="w-4 h-4 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
        ) : (
          <>
            <svg
              className="w-5 h-5 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        tabIndex={-1}
      />
    </div>
  )
}
