
















const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'


export const INVITE_CODE_LENGTH = 8





export const INVITE_LIFETIME_HOURS = 72


export function normalizeInviteCode(raw: string): string {
  return raw.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
}


export function isInviteCode(raw: string): boolean {
  const code = normalizeInviteCode(raw)
  if (code.length !== INVITE_CODE_LENGTH) return false
  return [...code].every((char) => ALPHABET.includes(char))
}












export function extractInviteCode(input: string): string {
  const value = input.trim()
  if (value.length === 0) return ''

  return extractCandidate(value) ?? normalizeInviteCode(value)
}







function extractCandidate(value: string): string | null {
  
  if (isInviteCode(value)) return normalizeInviteCode(value)

  
  
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withScheme)

    const fromQuery = normalizeCandidate(url.searchParams.get('code'))
    if (fromQuery !== null) return fromQuery

    const segments = url.pathname.split('/').filter((segment) => segment.length > 0)
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const candidate = normalizeCandidate(decodeURIComponent(segments[index]!))
      if (candidate !== null) return candidate
    }
  } catch {
    
  }

  
  
  const matched = /[?&#]code=([^&#\s]+)/i.exec(value)
  if (matched?.[1] !== undefined) {
    const candidate = normalizeCandidate(decodeURIComponent(matched[1]))
    if (candidate !== null) return candidate
  }

  return null
}




function normalizeCandidate(raw: string | null): string | null {
  if (raw === null) return null
  const code = normalizeInviteCode(raw)
  return code.length === INVITE_CODE_LENGTH && isInviteCode(code) ? code : null
}








export function looksLikeJoinLinkWithoutCode(input: string): boolean {
  const value = input.trim()
  if (value.length === 0) return false
  if (extractCandidate(value) !== null) return false

  
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value) || /^[^\s/]+\.[^\s/]+\//.test(value)
}
