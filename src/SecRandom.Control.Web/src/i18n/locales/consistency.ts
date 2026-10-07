import zhCN from './zh-CN'
import enUS from './en-US'
import jaJP from './ja-JP'
import type { MessageSchema } from '../types'














type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false


type Assert<T extends true> = T


export type SourceMatchesSchema = Assert<Exact<typeof zhCN, MessageSchema>>


export type EnMatchesSource = Assert<Exact<typeof enUS, typeof zhCN>>


export type JaMatchesSource = Assert<Exact<typeof jaJP, typeof zhCN>>








export function findMissingKeys(): string[] {
  const problems: string[] = []

  const walk = (source: unknown, target: unknown, path: string): void => {
    if (source === null || typeof source !== 'object') return
    if (target === null || typeof target !== 'object') {
      problems.push(path)
      return
    }

    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      const next = `${path ? `${path}.` : ''}${key}`
      if (!(key in (target as Record<string, unknown>))) {
        problems.push(next)
        continue
      }
      walk(value, (target as Record<string, unknown>)[key], next)
    }
  }

  walk(zhCN, enUS, '')
  walk(zhCN, jaJP, '')
  return problems
}










export function flattenLeafKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix]

  const keys: string[] = []
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    keys.push(...flattenLeafKeys(child, `${prefix ? `${prefix}.` : ''}${key}`))
  }
  return keys
}
