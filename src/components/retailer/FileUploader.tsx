import { useId, useRef, useState } from 'react'
import { ImagePlus, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  accepts,
  storagePath,
  uploadRule,
  UPLOAD_NOTE,
  validateUpload,
  type StorageBucket,
} from '@/lib/uploads'

/* One upload control, used by both buckets. Reads as a drop target but is a
   plain labelled file input underneath, so it is reachable by keyboard and works
   without any drag at all. A refused file says why beside the control. */

export type PickedFile = { path: string; name: string; size: number }

export function FileUploader({
  bucket,
  companyId,
  label,
  multiple = false,
  value,
  onChange,
}: {
  bucket: StorageBucket
  companyId: string
  label: string
  multiple?: boolean
  value: PickedFile[]
  onChange: (next: PickedFile[]) => void
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const Icon = bucket === 'product-images' ? ImagePlus : Paperclip

  function take(files: FileList | null) {
    if (!files || files.length === 0) return
    const accepted: PickedFile[] = []
    let problem: string | null = null
    for (const file of Array.from(files)) {
      const verdict = validateUpload(file, bucket)
      if (!verdict.ok) {
        problem = verdict.message
        continue
      }
      accepted.push({
        path: storagePath(companyId, file),
        name: file.name,
        size: file.size,
      })
    }
    setError(problem)
    if (accepted.length > 0) {
      onChange(multiple ? [...value, ...accepted] : accepted.slice(-1))
    }
    if (input.current) input.current.value = ''
  }

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="font-label text-sm font-medium">
        {label}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          take(e.dataTransfer.files)
        }}
        className={`mt-1 flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2 ${
          dragging ? 'border-teal bg-teal-soft' : 'border-input bg-card'
        }`}
      >
        <Icon className="size-4 shrink-0 text-teal-text" strokeWidth={1.5} aria-hidden="true" />
        <span className="min-w-0 flex-1 text-xs text-muted-foreground">{uploadRule(bucket)}</span>
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 px-3"
          onClick={() => input.current?.click()}
        >
          Choose {multiple ? 'files' : 'file'}
        </Button>
        <input
          ref={input}
          id={id}
          type="file"
          multiple={multiple}
          accept={accepts(bucket)}
          onChange={(e) => take(e.target.files)}
          className="sr-only"
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul className="mt-2 space-y-1">
          {value.map((file) => (
            <li
              key={file.path}
              className="flex min-w-0 items-center gap-2 rounded-md bg-secondary px-2 py-1 text-xs"
            >
              <span className="min-w-0 flex-1 truncate" title={file.name}>
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((f) => f.path !== file.path))}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
                <span className="sr-only">Remove {file.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1 text-xs text-muted-foreground">{UPLOAD_NOTE}</p>
    </div>
  )
}
