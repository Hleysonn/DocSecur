const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options
  })
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

