import { useState } from 'react'
import { AlertTriangle, Check, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CSV_COLUMNS,
  MAX_IMPORT_ROWS,
  csvTemplate,
  offersFromCsv,
  type ImportVerdict,
} from '@/data/offersCsv'
import { logImport, upsertOffers, type ImportRecord, type Offer } from '@/data/offers'
import type { Account } from '@/data/accounts'

/* Bulk upload: one CSV, up to 1,000 rows, read on the client, reviewed line by
   line, then written. Nothing is written until Import is pressed, and the
   record of what was written is what the upload history lists. */

type Read = {
  offers: Offer[]
  issues: { line: number; message: string }[]
  verdicts: ImportVerdict[]
  unknownHeaders: string[]
  dropped: number
  file: string
}

export function BulkUpload({
  account,
  existingIds,
  onImported,
}: {
  account: Account
  /** Product ids this company already holds, so a row can be marked as a replace. */
  existingIds: Set<string>
  onImported: (record: ImportRecord) => void
}) {
  const [read, setRead] = useState<Read | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function download() {
    const blob = new Blob([csvTemplate()], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'oman-shoppers-price-book.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onFile(file: File) {
    setError(null)
    setRead(null)
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      setError(
        'Excel files are a zip of XML, which cannot be read here. Save the sheet as CSV in Excel and upload that instead.',
      )
      return
    }
    if (!/\.csv$/i.test(file.name)) {
      setError('Choose a .csv file exported from your own sheet.')
      return
    }
    setBusy(true)
    try {
      const text = await file.text()
      const parsed = offersFromCsv(text, {
        id: account.id,
        shop: account.org || account.name,
        store: account.stores[0] ?? 'City Centre Muscat',
      })
      setRead({ ...parsed, file: file.name })
    } finally {
      setBusy(false)
    }
  }

  /* Rows replacing an existing product are marked after the parse, against the
     company's current rows, so the review table says which is which up front. */
  const verdicts: ImportVerdict[] | undefined = read?.verdicts.map((v) =>
    v.status !== 'rejected' && existingIds.has(v.productId) ? { ...v, status: 'replaced' } : v,
  )
  const adds = read ? read.offers.filter((o) => !existingIds.has(o.productId)).length : 0
  const replaces = read ? read.offers.length - adds : 0
  const rejected = read ? read.verdicts.filter((v) => v.status === 'rejected').length : 0

  function commit() {
    if (!read) return
    upsertOffers(read.offers)
    const record: ImportRecord = {
      id: `imp-${Date.now().toString(36)}`,
      retailerId: account.id,
      company: account.org || account.name,
      file: read.file,
      at: new Date().toISOString(),
      by: account.email,
      rows: read.offers.length + rejected,
      written: read.offers.length,
      added: adds,
      replaced: replaces,
      rejected,
      issues: read.issues,
    }
    logImport(record)
    onImported(record)
    setRead(null)
  }

  return (
    <div className="min-w-0">
      <div className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">Upload a price list</h2>
        <p className="mt-0.5 max-w-[64ch] text-sm text-muted-foreground">
          One row per item, a header row naming the columns in any order, up to{' '}
          {MAX_IMPORT_ROWS.toLocaleString('en-GB')} rows a file. A row whose product id is already
          yours replaces that item; every other row is a new one. Rows are checked before anything is
          written.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-teal bg-teal-soft px-3 text-sm font-medium text-teal-deep">
            <Upload className="size-4" strokeWidth={1.5} aria-hidden="true" />
            {busy ? 'Reading…' : 'Choose a .csv file'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onFile(file)
                e.target.value = ''
              }}
            />
          </label>
          <Button type="button" variant="outline" className="h-11" onClick={download}>
            <Download className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Download the template
          </Button>
        </div>

        <details className="mt-4 min-w-0">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-teal-text">
            The columns a file reads
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <caption className="sr-only">Columns read from an uploaded CSV, and whether each is required.</caption>
              <thead>
                <tr className="font-label text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase">
                  <th scope="col" className="py-1 pr-3">Column</th>
                  <th scope="col" className="py-1 pr-3">Required</th>
                  <th scope="col" className="py-1">Example</th>
                </tr>
              </thead>
              <tbody>
                {CSV_COLUMNS.map((c) => (
                  <tr key={c.key} className="border-t border-border">
                    <td className="py-1 pr-3">{c.label}</td>
                    <td className="py-1 pr-3 text-muted-foreground">{c.required ? 'Yes' : '—'}</td>
                    <td className="py-1 font-mono text-xs text-muted-foreground">{c.example || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {error && (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded-md bg-saffron-soft px-3 py-2 text-sm text-saffron-ink">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          {error}
        </p>
      )}

      {read && verdicts && (
        <div className="mt-4 min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-bold">Review {read.file}</h3>
            <p className="font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
              Nothing written yet
            </p>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['New items', adds],
              ['Replacing', replaces],
              ['Rejected rows', rejected],
              ['Ignored columns', read.unknownHeaders.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="min-w-0 rounded-lg border border-border bg-secondary px-3 py-2">
                <dt className="font-label text-[0.68rem] tracking-[0.06em] text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="font-mono text-lg font-semibold tabular-nums text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          {read.unknownHeaders.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ignored columns: {read.unknownHeaders.join(', ')}.
            </p>
          )}
          {read.dropped > 0 && (
            <p className="mt-2 rounded-md bg-saffron-soft px-3 py-2 text-sm text-saffron-ink">
              {read.dropped} rows past the {MAX_IMPORT_ROWS.toLocaleString('en-GB')}-row limit were not
              read. Split the sheet and upload the rest.
            </p>
          )}

          <div className="mt-4 max-h-80 overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Every line of the uploaded file, and what will happen to it.</caption>
              <thead className="sticky top-0 bg-secondary">
                <tr className="font-label text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase">
                  <th scope="col" className="px-3 py-2">Line</th>
                  <th scope="col" className="px-3 py-2">Product ID</th>
                  <th scope="col" className="px-3 py-2">Name</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {verdicts.map((v) => (
                  <tr key={`${v.line}-${v.productId}`} className="border-t border-border align-top">
                    <td className="px-3 py-2 font-mono text-xs tabular-nums text-muted-foreground">{v.line}</td>
                    <td className="max-w-[12rem] truncate px-3 py-2 font-mono text-xs">{v.productId || '—'}</td>
                    <td className="max-w-[16rem] truncate px-3 py-2">{v.name || '—'}</td>
                    <td className="px-3 py-2">
                      {v.status === 'new' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2 py-0.5 font-label text-[0.7rem] text-teal-deep">
                          <Check className="size-3" strokeWidth={2} aria-hidden="true" />
                          New
                        </span>
                      )}
                      {v.status === 'replaced' && (
                        <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 font-label text-[0.7rem] text-secondary-foreground">
                          Replaces yours
                        </span>
                      )}
                      {v.status === 'rejected' && (
                        <span className="block text-xs text-saffron-ink">
                          <span className="font-medium">Rejected</span> — {v.message}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {read.offers.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-11 bg-teal px-4 text-teal-foreground hover:bg-teal-deep"
                onClick={commit}
              >
                Import {read.offers.length} {read.offers.length === 1 ? 'item' : 'items'}
              </Button>
              <Button type="button" variant="outline" className="h-11" onClick={() => setRead(null)}>
                Discard this file
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Nothing in that file can be written. Download the template to see the shape it expects.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
