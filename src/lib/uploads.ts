/* Storage uploads for the retailer dashboard, in two buckets with different
   rules:

   - product-images  — public read. jpg, png, webp. 5 MB. Only the storage path
     is kept (see Offer.image1Path / image2Path); the public URL is built at
     render time from the path, so a bucket rename or CDN move does not rewrite
     every row.
   - retailer-documents — private. pdf, jpg, png. 10 MB. Never a public URL: a
     signed URL is issued to the uploader and to admins.

   Validation runs here, in the browser, so the retailer sees the reason before a
   byte is read. The server repeats the same check — type and size — on receipt,
   because a client check is a courtesy, not a control. */

export const IMAGE_BUCKET = 'product-images'
export const DOCUMENT_BUCKET = 'retailer-documents'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const

export type StorageBucket = typeof IMAGE_BUCKET | typeof DOCUMENT_BUCKET

export type UploadVerdict = { ok: true } | { ok: false; message: string }

export function accepts(bucket: StorageBucket) {
  return bucket === IMAGE_BUCKET ? IMAGE_TYPES.join(',') : DOCUMENT_TYPES.join(',')
}

/** The rule, as a sentence, so the form can state it beside the control. */
export function uploadRule(bucket: StorageBucket) {
  return bucket === IMAGE_BUCKET
    ? 'JPG, PNG or WebP, up to 5 MB.'
    : 'PDF, JPG or PNG, up to 10 MB. Only you and an admin can open it.'
}

/** Check one file against its bucket. Type first, then size. */
export function validateUpload(file: File, bucket: StorageBucket): UploadVerdict {
  const types: readonly string[] = bucket === IMAGE_BUCKET ? IMAGE_TYPES : DOCUMENT_TYPES
  if (!types.includes(file.type)) {
    const list = bucket === IMAGE_BUCKET ? 'JPG, PNG or WebP' : 'PDF, JPG or PNG'
    return { ok: false, message: `${file.name} is ${file.type || 'an unknown type'}. Only ${list}.` }
  }
  const max = bucket === IMAGE_BUCKET ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES
  if (file.size > max) {
    return {
      ok: false,
      message: `${file.name} is ${megabytes(file.size)}. The limit is ${megabytes(max)}.`,
    }
  }
  if (file.size === 0) return { ok: false, message: `${file.name} is empty.` }
  return { ok: true }
}

export function megabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 1024 * 1024 ? 1 : 0)} MB`
}

/**
 * The path a file is stored at: company first, so every signed URL and every
 * storage policy can be scoped to the company that wrote it. The original name is
 * kept but stripped to a safe set, and a timestamp keeps two uploads of the same
 * name apart.
 */
export function storagePath(companyId: string, file: File, now = Date.now()) {
  const clean = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-80)
  return `${companyId}/${now}-${clean || 'upload'}`
}

/** The public address of a stored object, built at render time — never stored. */
export function publicImageUrl(path: string | null | undefined, supabaseUrl?: string) {
  if (!path) return null
  const base = supabaseUrl ?? ''
  if (!base) return null
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`
}

/**
 * Where an upload stands in this build. There is no auth client and no server, so
 * nothing is sent: the path is recorded against the row and the file itself
 * stays on the device. Said plainly rather than faked with a green tick.
 */
export const UPLOAD_NOTE =
  'This build has no storage connection, so the file is recorded against the row and kept on this device. Nothing is uploaded.'
