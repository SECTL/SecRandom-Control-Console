import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'
import { findMissingKeys, flattenLeafKeys } from './locales/consistency'
import type { MessageSchema } from './types'
import { SUPPORTED_LOCALES, createAppI18n, useCapabilityLabel } from './index'
import { applyLocale } from './apply-locale'


function read(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || typeof value !== 'object') return undefined
    return (value as Record<string, unknown>)[key]
  }, source)
}








describe('i18n 语言包', () => {
  it('支持的语言是中文、英语、日语三种', () => {
    expect([...SUPPORTED_LOCALES]).toEqual(['zh-CN', 'en-US', 'ja-JP'])
  })

  it('三种语言没有缺失的 key', () => {
    expect(findMissingKeys()).toEqual([])
  })

  it('三种语言都没有空值与占位符残留', () => {
    for (const [name, messages] of Object.entries({
      'zh-CN': zhCN,
      'en-US': enUS,
      'ja-JP': jaJP,
    })) {
      const walk = (value: unknown, path: string): void => {
        if (typeof value === 'string') {
          expect(value.trim(), `${name} 的 ${path} 不应为空`).not.toBe('')
          
          expect(value, `${name} 的 ${path} 不应残留未完成标记`).not.toMatch(/\bTODO\b|\bFIXME\b/)
          return
        }
        if (value !== null && typeof value === 'object') {
          for (const [key, child] of Object.entries(value)) {
            walk(child, `${path}.${key}`)
          }
        }
      }
      walk(messages, name)
    }
  })

  it('英日文与中文确实不同（防止复制后漏翻译）', () => {
    
    for (const key of Object.keys(zhCN.capabilities) as (keyof typeof zhCN.capabilities)[]) {
      expect(enUS.capabilities[key], `en-US.capabilities.${key} 似乎未翻译`).not.toBe(
        zhCN.capabilities[key],
      )
      expect(jaJP.capabilities[key], `ja-JP.capabilities.${key} 似乎未翻译`).not.toBe(
        zhCN.capabilities[key],
      )
    }

    
    
    const auditDetailKeys = flattenLeafKeys(zhCN.auditDetail)
    for (const key of auditDetailKeys) {
      const zh = read(zhCN.auditDetail, key)
      expect(read(enUS.auditDetail, key), `en-US.auditDetail.${key} 似乎未翻译`).not.toBe(zh)
      expect(read(jaJP.auditDetail, key), `ja-JP.auditDetail.${key} 似乎未翻译`).not.toBe(zh)
    }

    
    
    
    for (const key of [
      'filterAll',
      'filterGroup',
      'filterType',
      'filterOutcome',
      'filterRange',
      'filterActorDevice',
      'filterTargetNode',
      'filterActor',
      'sourceWeb',
      'sourceApp',
      'facetsTruncated',
      'total',
      'pageOf',
      'prevPage',
      'nextPage',
      'rangeAll',
      'rangeToday',
      'range7d',
      'range30d',
      'emptyFiltered',
      'export',
      'exporting',
      'exported',
      'exportTruncated',
      'exportEmpty',
      'exportFailed',
    ] as const) {
      expect(enUS.audit[key], `en-US.audit.${key} 似乎未翻译`).not.toBe(zhCN.audit[key])
      expect(jaJP.audit[key], `ja-JP.audit.${key} 似乎未翻译`).not.toBe(zhCN.audit[key])
    }
  })

  it('能力名与协议常量完全对应', () => {
    
    
    
    
    expect(flattenLeafKeys(zhCN.capabilities).sort()).toEqual(
      [
        'draw.lock',
        'draw.reset',
        'draw.trigger',
        'draw.trigger.conditions',
        'media.play',
        'node.status.read',
        'proof.list',
        'roster.read',
        'roster.write',
        'settings.read',
        'settings.write',
      ].sort(),
    )
  })

  it('切换语言后取到对应译文', () => {
    const i18n = createI18n<[MessageSchema], (typeof SUPPORTED_LOCALES)[number]>({
      legacy: false,
      locale: 'zh-CN',
      fallbackLocale: 'zh-CN',
      messages: { 'zh-CN': zhCN, 'en-US': enUS, 'ja-JP': jaJP },
    })

    const t = i18n.global.t

    expect(t('console.myGroups')).toBe('我的组')

    applyLocale(i18n.global, 'en-US')
    expect(t('console.myGroups')).toBe('My groups')

    applyLocale(i18n.global, 'ja-JP')
    expect(t('console.myGroups')).toBe('マイグループ')
  })

  it('角色名三语齐全（权限界面会直接显示）', () => {
    const roles = ['viewer', 'operator', 'admin', 'owner'] as const
    for (const role of roles) {
      for (const messages of [zhCN, enUS, jaJP]) {
        expect(messages.roles[role].length).toBeGreaterThan(0)
        expect(messages.rolesDesc[role].length).toBeGreaterThan(0)
      }
    }
  })

  


















  it('三语的能力名都能取到译文，不会原样渲染 key', () => {
    const app = createAppI18n('zh-CN')
    const zh = useCapabilityLabel((key) => app.global.tm(key))

    const capabilityNames = flattenLeafKeys(zhCN.capabilities)

    
    
    for (const locale of SUPPORTED_LOCALES) {
      const localized = createAppI18n(locale)
      const label = useCapabilityLabel((key) => localized.global.tm(key))
      for (const capability of capabilityNames) {
        expect(label(capability), `${locale} 的 ${capability} 原样渲染成了 key`).not.toBe(
          capability,
        )
      }
    }

    expect(zh('node.status.read')).toBe('读取状态')
    expect(zh('draw.lock')).toBe('禁止 / 允许抽取')
    
    expect(zh('draw.trigger.conditions')).toBe('抽奖筛选条件')

    
    expect(zh('made.up.name')).toBe('made.up.name')

    
    expect(app.global.t('capabilities.draw.trigger.conditions')).toBe(
      'capabilities.draw.trigger.conditions',
    )
  })

  












  it('没有组件用 t() 直接拼能力名（唯一入口是 useCapabilityLabel）', () => {
    
    
    const sources = import.meta.glob('../**/*.{vue,ts}', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>

    const offenders = Object.entries(sources)
      .filter(([path]) => !path.endsWith('.spec.ts'))
      .filter(([, source]) => /\bt\(\s*`capabilities\./.test(source))
      .map(([path]) => path.replace('../', 'src/'))

    expect(offenders).toEqual([])
  })
})
