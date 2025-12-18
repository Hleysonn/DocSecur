type Primitive = string | number | boolean | null | undefined

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;'
}

function cleanString(value: string) {
  const withoutScripts = value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  return withoutScripts.replace(/[&<>"']/g, (ch) => escapeMap[ch] ?? ch)
}

function sanitizeValue<T>(value: T): T {
  if (typeof value === 'string') {
    return cleanString(value) as T
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v)) as T
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      // @ts-expect-error dynamic assignment for sanitization
      value[key] = sanitizeValue((value as any)[key])
    }
    return value
  }
  return value
}

export function sanitizeInput(req: any, _res: any, next: any) {
  req.body = sanitizeValue(req.body)
  req.query = sanitizeValue(req.query)
  req.params = sanitizeValue(req.params)
  next()
}


