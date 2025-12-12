import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../http/api'

type MeResponse = { id: string; email: string; name: string; role: string }

export function ProfilePage() {
  const { accessToken } = useAuth()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const authHeader = useMemo(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
    [accessToken]
  )

  useEffect(() => {
    if (!accessToken) return
    setError(null)
    api
      .get('/auth/me', { headers: authHeader })
      .then((res) => {
        setMe(res)
        setName(res.name ?? '')
      })
      .catch((err) => setError(err.message))
  }, [accessToken, authHeader])

  const onSave = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await api.patch(
        '/auth/profile',
        { name: name.trim() || undefined, password: password || undefined },
        { headers: authHeader }
      )
      setSuccess('Profil mis à jour')
      setPassword('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Profil</h1>
        <p className="text-sm text-slate-300">Mettre à jour vos informations.</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}

      {me && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <div>
            <p className="text-slate-200 text-sm">Email</p>
            <p className="text-slate-50 text-base">{me.email}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200" title='nom'>Nom</label>
            <input
              value={name}
              title='nom'
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 outline-none ring-blue-500 focus:ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              title='pswd'
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 outline-none ring-blue-500 focus:ring"
            />
            <p className="text-xs text-slate-400">Laisser vide pour ne pas changer.</p>
          </div>
          <button
            onClick={onSave}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}
    </div>
  )
}

