const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

let accessToken: string | null = null
let onTokenRefreshed: ((token: string) => void) | null = null
let csrfToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function registerTokenRefreshed(cb: (token: string) => void) {
  onTokenRefreshed = cb
}

async function fetchCsrfToken() {
  const res = await fetch(`${API_URL}/auth/csrf`, {
    method: 'GET',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('CSRF token manquant')
  const data = await res.json()
  csrfToken = data.csrfToken
  return csrfToken
}

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken
  try {
    return await fetchCsrfToken()
  } catch {
    return null
  }
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!res.ok) {
    throw new Error('Refresh invalide')
  }
  const data = await res.json()
  if (data.accessToken) {
    accessToken = data.accessToken
    onTokenRefreshed?.(data.accessToken)
  }
  return data.accessToken as string
}

async function request(path: string, options: RequestInit = {}, retry = true) {
  const headers = new Headers(options.headers || {})
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const method = (options.method || 'GET').toString().toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await ensureCsrfToken()
    if (token) headers.set('X-CSRF-Token', token)
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  })

  if (res.status === 401 && retry) {
    try {
      const newAccess = await refreshAccessToken()
      if (newAccess) {
        headers.set('Authorization', `Bearer ${newAccess}`)
        const retryRes = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
          credentials: 'include'
        })
        if (!retryRes.ok) {
          const message = await retryRes.text()
          throw new Error(message || 'Erreur API')
        }
        const retryContentType = retryRes.headers.get('content-type')
        if (retryContentType && retryContentType.includes('application/json')) {
          return retryRes.json()
        }
        return retryRes.text()
      }
    } catch (err) {
      throw err
    }
  }

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || 'Erreur API')
  }
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  }
  return res.text()
}

export const api = {
  get: (path: string, opts: RequestInit = {}) => request(path, opts),
  post: (path: string, body: unknown, opts: RequestInit = {}) =>
    request(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      },
      body: JSON.stringify(body),
      ...opts
    }),
  postForm: (path: string, form: FormData, opts: RequestInit = {}) =>
    request(path, {
      method: 'POST',
      body: form,
      ...opts
    }),
  del: (path: string, opts: RequestInit = {}) =>
    request(path, {
      method: 'DELETE',
      ...opts
    }),
  patch: (path: string, body: unknown, opts: RequestInit = {}) =>
    request(path, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      },
      body: JSON.stringify(body),
      ...opts
    })
}

