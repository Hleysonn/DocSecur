import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../http/api'
import { sanitizeText } from '../ui/sanitize'

type Doc = {
  _id: string
  type: string
  version: number
  ownerId: string
  ownerName?: string
  createdAt?: string
  canDelete?: boolean
  canDownload?: boolean
}

export function DocumentsPage() {
  const { accessToken } = useAuth()
  const [docs, setDocs] = useState<Doc[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    api
      .get('/documents')
      .then((res) => setDocs(res))
      .catch((err) => setError(err.message))
  }, [accessToken])

  const uploadFile = async () => {
    if (!file) {
      setError('Sélectionnez un fichier')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.postForm('/documents/upload', form)
      const refreshed = await api.get('/documents')
      setDocs(refreshed)
      setFile(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Documents</h1>
          <p className="text-sm text-slate-300">Liste chiffrée de vos fichiers et partages.</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{sanitizeText(error)}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {docs.map((doc) => (
          <div
            key={doc._id}
            className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40 p-4 shadow-lg shadow-blue-500/10 transition hover:-translate-y-1 hover:border-blue-600/50 hover:shadow-blue-500/25"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.06),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.06),transparent_25%)] opacity-90" />
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-blue-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/30 text-blue-100">
                    <DocIcon mime={doc.type} />
                  </span>
                  Document
                </div>
                <p className="text-sm font-semibold text-slate-50 break-all mt-1 line-clamp-2">
                  {doc._id}
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                v{doc.version}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Type : {doc.type}
              </p>
              <p className="text-xs text-slate-400">
                Uploadé par {doc.ownerName ?? doc.ownerId}
              </p>
              {doc.createdAt && (
                <p className="text-xs text-slate-400">
                  Créé le {new Date(doc.createdAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => downloadDoc(doc._id)}
                disabled={doc.canDownload === false}
                className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-100 transition hover:border-slate-500 hover:bg-slate-800/60 disabled:opacity-60 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
              >
                Télécharger
              </button>
              <button
                onClick={() => previewDoc(doc._id)}
                disabled={doc.canDownload === false}
                className="rounded-lg border border-blue-700 px-3 py-1 text-sm text-blue-100 transition hover:border-blue-500 hover:bg-blue-700/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
              >
                Ouvrir
              </button>
              <button
                onClick={() => deleteDoc(doc._id)}
                disabled={busyId === doc._id || doc.canDelete === false}
                className="rounded-lg border border-red-700 px-3 py-1 text-sm text-red-100 transition hover:border-red-500 hover:bg-red-900/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-blue-500/5">
        <h2 className="text-lg font-semibold text-slate-50">Uploader (PDF, DOCX, XLSX)</h2>
        <p className="text-sm text-slate-400">
          Taille max 50 Mo. Les fichiers sont chiffrés côté serveur.
        </p>
        <input
          title='doc'
          type="file"
          accept=".pdf,.docx,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-200"
        />
        <button
          onClick={uploadFile}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? 'Upload...' : 'Envoyer'}
        </button>
      </div>
    </div>
  )

  async function downloadDoc(id: string) {
    setError(null)
    try {
      const res = await api.get(`/documents/${id}/download`)
      triggerDownload(res.base64, res.mime, res.name)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  async function previewDoc(id: string) {
    setError(null)
    try {
      const res = await api.get(`/documents/${id}/download`)
      const blob = base64ToBlob(res.base64, res.mime || 'application/octet-stream')
      const url = URL.createObjectURL(blob)
      if (res.mime && res.mime.includes('pdf')) {
        window.open(url, '_blank')
      } else {
        triggerDownload(res.base64, res.mime, res.name)
      }
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  async function deleteDoc(id: string) {
    setError(null)
    setBusyId(id)
    try {
      await api.del(`/documents/${id}`)
      setDocs((prev) => prev.filter((d) => d._id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setBusyId(null)
    }
  }
}

function base64ToBlob(base64: string, mime: string) {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mime })
}

function triggerDownload(base64: string, mime?: string, name?: string) {
  const blob = base64ToBlob(base64, mime || 'application/octet-stream')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name || 'document'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function DocIcon({ mime }: { mime: string }) {
  if (mime.includes('pdf')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h4m-4 5h6M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" />
      </svg>
    )
  }
  if (mime.includes('sheet') || mime.includes('excel') || mime.includes('xls')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h8M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" />
    </svg>
  )
}
