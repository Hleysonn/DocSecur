import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../http/api'

type AdminUser = { _id: string; role: 'USER' | 'MANAGER' | 'ADMIN'; createdAt?: string }
type AdminLog = { _id: string; action: string; resource: string; createdAt: string }

export function AdminPage() {
  const { user, accessToken } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [logPage, setLogPage] = useState(0)
  const pageSize = 5
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const authHeader = useMemo(() => {
    if (!accessToken) return undefined
    return { Authorization: `Bearer ${accessToken}` } as const
  }, [accessToken])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [u, l] = await Promise.all([
        api.get('/admin/users', { headers: authHeader }),
        api.get('/admin/logs', { headers: authHeader })
      ])
      setUsers(u)
      setLogs(l)
      setLogPage(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [authHeader])

  useEffect(() => {
    if (!accessToken) return
    void loadData()
  }, [accessToken, loadData])

  async function changeRole(userId: string, role: AdminUser['role']) {
    setSavingId(userId)
    setError(null)
    try {
      const res = await api.post(
        `/admin/users/${userId}/role`,
        { role },
        {
          headers: {
            ...(authHeader ?? {}),
            'Content-Type': 'application/json'
          },
          method: 'PATCH'
        }
      )
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: res.role } : u)))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Espace admin</h1>
          <p className="text-sm text-slate-300">
            Connecté en {user?.role}. Gestion des utilisateurs et journaux.
          </p>
        </div>
        <button
          onClick={loadData}
          className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-100 hover:border-slate-500"
        >
          Rafraîchir
        </button>
      </div>

      {loading && <p className="text-sm text-slate-300">Chargement...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-50">Utilisateurs</h2>
          </div>
          <div className="mt-3 space-y-2">
            {users.length === 0 && <p className="text-slate-400 text-sm">Aucun utilisateur</p>}
            {users.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
              >
                <div>
                  <p className="text-slate-100 break-all">{u._id}</p>
                  <p className="text-xs text-slate-400">
                    Créé le {u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <select
                  name='Rôle'
                  title='Rôle'
                  disabled={savingId === u._id}
                  value={u.role}
                  onChange={(e) => changeRole(u._id, e.target.value as AdminUser['role'])}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                >
                  <option value="USER">USER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-50">Journaux récents</h2>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <button
                disabled={logPage === 0}
                onClick={() => setLogPage((p) => Math.max(0, p - 1))}
                className="rounded border border-slate-700 px-2 py-1 disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {logPage + 1} / {Math.max(1, Math.ceil(logs.length / pageSize))}
              </span>
              <button
                disabled={(logPage + 1) * pageSize >= logs.length}
                onClick={() =>
                  setLogPage((p) =>
                    (p + 1) * pageSize >= logs.length ? p : p + 1
                  )
                }
                className="rounded border border-slate-700 px-2 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {logs.length === 0 && <p className="text-slate-400 text-sm">Aucun log</p>}
            {logs.slice(logPage * pageSize, logPage * pageSize + pageSize).map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
              >
                <div>
                  <p className="text-slate-100">{log.action}</p>
                  <p className="text-xs text-slate-400">{log.resource}</p>
                </div>
                <span className="text-xs text-slate-300">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
