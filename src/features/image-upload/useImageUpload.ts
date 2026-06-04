import { useState, useCallback } from 'react'
import { useStudioStore } from '@/app/store'
import { extractBrightnessMap } from './extractBrightnessMap'

interface UseImageUploadReturn {
  isProcessing: boolean
  error: string | null
  handleFile: (file: File) => void
  clearError: () => void
}

export function useImageUpload(): UseImageUploadReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setImage = useStudioStore((s) => s.setImage)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a JPEG or PNG image.')
        return
      }

      setIsProcessing(true)
      setError(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataURL = e.target?.result as string
        const img = new Image()
        img.onload = () => {
          try {
            const { map, rgbaMap, width, height } = extractBrightnessMap(img)
            setImage(dataURL, map, rgbaMap, width, height)
          } catch {
            setError('Could not read this image. Please try a JPEG or PNG.')
          } finally {
            setIsProcessing(false)
          }
        }
        img.onerror = () => {
          setError('Failed to load image. Please try another file.')
          setIsProcessing(false)
        }
        img.src = dataURL
      }
      reader.onerror = () => {
        setError('Failed to read file.')
        setIsProcessing(false)
      }
      reader.readAsDataURL(file)
    },
    [setImage]
  )

  const clearError = useCallback(() => setError(null), [])

  return { isProcessing, error, handleFile, clearError }
}
