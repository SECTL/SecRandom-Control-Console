import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'
import type { MessageSchema } from './types'
import { applyLocale } from './apply-locale'


export const SUPPORTED_LOCALES = ['zh-CN', 'en-US', 'ja-JP'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_KEY = 'srctrl:locale'

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}


















export function useCapabilityLabel(
  tm: (key: string) => unknown,
): (capability: string) => string {
  return (capability: string): string => {
    const tree = tm('capabilities')
    if (tree === null || typeof tree !== 'object') return capability

    
    
    const direct = (tree as Record<string, unknown>)[capability]
    if (typeof direct === 'string' && direct.length > 0) return direct

    
    
    let node: unknown = tree
    for (const segment of capability.split('.')) {
      if (node === null || typeof node !== 'object') return capability
      node = (node as Record<string, unknown>)[segment]
    }
    return typeof node === 'string' && node.length > 0 ? node : capability
  }
}








export const currentLocale = ref<AppLocale>(resolveInitialLocale())







export function resolveInitialLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isAppLocale(stored)) return stored
  } catch {
    
  }

  const candidates =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  for (const candidate of candidates) {
    const tag = candidate.toLowerCase()
    if (tag.startsWith('zh')) return 'zh-CN'
    if (tag.startsWith('ja')) return 'ja-JP'
    if (tag.startsWith('en')) return 'en-US'
  }

  return 'zh-CN'
}










function appI18nOptions(locale: AppLocale = currentLocale.value) {
  return {
    
    legacy: false as const,
    locale,
    fallbackLocale: 'zh-CN',

    












    flatJson: true,

    messages: {
      'zh-CN': zhCN,
      'en-US': enUS,
      'ja-JP': jaJP,
    },
    
    missingWarn: import.meta.env.DEV,
    fallbackWarn: import.meta.env.DEV,
  }
}


export function createAppI18n(locale?: AppLocale) {
  return createI18n<[MessageSchema], AppLocale>(appI18nOptions(locale))
}

export const i18n = createAppI18n()

export function setLocale(locale: AppLocale): void {
  currentLocale.value = locale
  applyLocale(i18n.global, locale)

  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    
  }

  
  document.documentElement.lang = locale
}
