import { ApiError } from '@/api/client'


export type Translate = (key: string) => string





















export function apiErrorMessage(
  t: Translate,
  namespace: string,
  code: string | null,
  options: {
    status?: number | null
    overrides?: Record<number, string>
    fallbackKey?: string
  } = {},
): string | null {
  if (code === null) return null

  const fallbackKey = options.fallbackKey ?? 'errors.unknown'
  const status = options.status ?? null
  const mapped = status === null ? undefined : options.overrides?.[status]
  const key = mapped ?? `${namespace}.${code}`

  const translated = t(key)
  return translated === key ? t(fallbackKey) : translated
}


export interface ErrorLike {
  code: string
  status: number | null
}


export function toErrorLike(caught: unknown): ErrorLike {
  if (caught instanceof ApiError) return { code: caught.code, status: caught.status }
  return { code: 'network_error', status: null }
}
