import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

interface ImageUploadProps {
  label: string
  value: File | null
  onChange: (file: File | null) => void
  existingUrl?: string | null
  onRemoveExisting?: () => void
  error?: string
  hint?: string
}

export function ImageUpload({
  label,
  value,
  onChange,
  existingUrl,
  onRemoveExisting,
  error,
  hint = 'JPG, PNG or WebP · up to 2 MB',
}: ImageUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(value)
    setPreviewUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [value])

  const preview = previewUrl ?? existingUrl ?? null
  const shownError = error ?? localError

  function handleFile(file: File | undefined) {
    if (!file) {
      return
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError('Choose a JPG, PNG or WebP image.')
      return
    }

    if (file.size > MAX_BYTES) {
      setLocalError('The image must be 2 MB or smaller.')
      return
    }

    setLocalError(null)
    onChange(file)
  }

  function clear() {
    setLocalError(null)
    onChange(null)
    onRemoveExisting?.()

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/60 text-muted-foreground',
            shownError && 'border-destructive',
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt="Selected preview"
              className="size-full object-cover"
            />
          ) : (
            <ImagePlus className="size-6" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload />
              {preview ? 'Replace image' : 'Upload image'}
            </Button>
            {preview ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{(shownError ?? hint) as string}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="sr-only"
        aria-invalid={shownError ? true : undefined}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  )
}
