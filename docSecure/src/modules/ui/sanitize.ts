const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;'
}

export function sanitizeText(input: unknown) {
  const str = typeof input === 'string' ? input : String(input ?? '')
  return str.replace(/[&<>"']/g, (ch) => escapeMap[ch] ?? ch)
}


