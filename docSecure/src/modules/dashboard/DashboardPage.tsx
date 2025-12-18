import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../http/api'

type StatResponse = {
  docsCount: number
  lastUpload: string | null
  types: Array<{ type: string; count: number }>
  recentDocs: Array<{ _id: string; type: string; version: number; createdAt: string }>
  recentLogs?: Array<{ _id: string; action: string; resource: string; createdAt: string }>
  usersCount?: number
}

export function DashboardPage() {
  const { accessToken, user } = useAuth()
  const [stats, setStats] = useState<StatResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = user?.role === 'ADMIN'

  const authHeader = useMemo(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
    [accessToken]
  )

  const loadStats = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/stats/overview', { headers: authHeader })
      setStats(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [accessToken, authHeader])

  useEffect(() => {
    if (!accessToken) return
    void loadStats()
  }, [accessToken, loadStats])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Tableau de bord</h1>
        <p className="text-slate-300">
          Vue globale de vos documents chiffrés et des dernières activités.
        </p>
      </div>

      {loading && <p className="text-slate-300 text-sm">Chargement...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <CardStat label="Documents" value={stats.docsCount.toString()} />
            <CardStat
              label="Dernier upload"
              value={stats.lastUpload ? new Date(stats.lastUpload).toLocaleString() : 'N/A'}
            />
            {user?.role === 'ADMIN' && stats.usersCount !== undefined && (
              <CardStat label="Utilisateurs" value={stats.usersCount.toString()} />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold text-slate-50">Par type</h2>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                {stats.types.length === 0 && <p className="text-slate-400">Aucune donnée</p>}
                {stats.types.map((t) => (
                  <div
                    key={t.type}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                  >
                    <span>{t.type}</span>
                    <span className="text-slate-100">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-semibold text-slate-50">Dernières activités</h2>
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  {(stats.recentLogs?.length ?? 0) === 0 && (
                    <p className="text-slate-400">Aucune activité récente</p>
                  )}
                  {stats.recentLogs?.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                    >
                      <div>
                        <p className="text-slate-100">{log.action}</p>
                        <p className="text-xs text-slate-400">{log.resource}</p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-semibold text-slate-50">Vue rapide</h2>
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  {/* <p className="text-slate-300">
                    Les journaux détaillés sont réservés aux administrateurs. Vous pouvez
                    néanmoins consulter vos documents et vos partages ci-dessous.
                  </p>
                  <p className="text-slate-400">
                    Astuce : utilisez l’onglet Documents pour prévisualiser ou télécharger vos
                    fichiers, et l’onglet Profil pour mettre à jour votre nom ou mot de passe.
                  </p> */}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold text-slate-50">Derniers documents</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm text-slate-200">
              {stats.recentDocs.length === 0 && (
                <p className="text-slate-400">Aucun document pour le moment</p>
              )}
              {stats.recentDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <p className="text-slate-100">{doc.type}</p>
                  <p className="text-xs text-slate-400">v{doc.version}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(doc.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-sm text-blue-200">{label}</p>
      <p className="text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  )
}


