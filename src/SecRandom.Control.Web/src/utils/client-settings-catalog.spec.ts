import { describe, expect, it } from 'vitest'
import * as lucide from '@lucide/vue'
import {
  CLIENT_SETTINGS_CATEGORIES,
  CLIENT_SETTINGS_GROUPS,
  CLIENT_SETTINGS_SNAPSHOT_SOURCE,
  OTHER_GROUP,
  categoryMetaOf,
} from './client-settings-catalog'
import { READABLE_SETTING_CATEGORIES } from './command-feedback'
import { CLIENT_SETTINGS_PAGES } from '@/data/client-settings-pages'
import zhCN from '@/i18n/locales/zh-CN'
import enUS from '@/i18n/locales/en-US'
import jaJP from '@/i18n/locales/ja-JP'

import {
  diffCatalog,
  diffCatalogOrder,
  diffGroupCaptions,
  readClientCatalog,
  resolveClientRoot,
} from '../../scripts/client-catalog-drift.mjs'























function clientRootOrSkip(): string | null {
  
  
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  return env?.['SECRANDOM_PATH'] ?? resolveClientRoot()
}

const CONSOLE_GROUP_LABELS: Record<string, Record<string, string>> = {
  'zh-CN': zhCN.nodeDetail.client.groups,
  'en-US': enUS.nodeDetail.client.groups,
  'ja-JP': jaJP.nodeDetail.client.groups,
}
describe('客户端设置目录快照', () => {
  it('分类 id 唯一，order 不重复', () => {
    const ids = CLIENT_SETTINGS_CATEGORIES.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)

    const orders = CLIENT_SETTINGS_CATEGORIES.map((entry) => entry.order)
    expect(new Set(orders).size).toBe(orders.length)
  })

  it('每个分类的分组都在分组表里', () => {
    const groupIds = new Set(CLIENT_SETTINGS_GROUPS.map((group) => group.id))
    for (const entry of CLIENT_SETTINGS_CATEGORIES) {
      expect(groupIds.has(entry.groupId), `${entry.id} 的分组 ${entry.groupId} 不存在`).toBe(true)
    }
  })

  it('分组顺序严格递增，且 other 永远在最后', () => {
    const orders = CLIENT_SETTINGS_GROUPS.map((group) => group.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    expect(OTHER_GROUP.order).toBe(Math.max(...orders))
  })

  it('引用的图标都是 @lucide/vue 真实导出的名字', () => {
    
    
    const exported = new Set(Object.keys(lucide))
    const names = [
      ...CLIENT_SETTINGS_GROUPS.map((group) => group.icon),
      ...CLIENT_SETTINGS_CATEGORIES.map((entry) => entry.icon),
    ]
    for (const name of names) {
      expect(exported.has(name), `${name} 不是 @lucide/vue 的导出`).toBe(true)
    }
  })

  it('快照出处记录了客户端提交号', () => {
    expect(CLIENT_SETTINGS_SNAPSHOT_SOURCE.clientCommit).toMatch(/^[0-9a-f]{7,40}$/)
    expect(CLIENT_SETTINGS_SNAPSHOT_SOURCE.repo).toBe('SecRandom')
  })

  it('未知分类回落到「其他」而不是丢掉', () => {
    const meta = categoryMetaOf('brand_new_category')
    expect(meta.groupId).toBe('other')
    expect(meta.icon).toBe('Settings')

    
    expect(categoryMetaOf('voice').groupId).toBe('notification')
  })

  







  it('operable 与 READABLE_SETTING_CATEGORIES 与快照里的页面三边一致', () => {
    const operable = CLIENT_SETTINGS_CATEGORIES.filter((entry) => entry.operable).map(
      (entry) => entry.id,
    )
    const pageIds = CLIENT_SETTINGS_PAGES.map((page) => page.id)

    expect([...operable].sort()).toEqual([...READABLE_SETTING_CATEGORIES].sort())
    expect([...operable].sort()).toEqual([...pageIds].sort())
  })

  it('快照与真实客户端源码一致（没有客户端仓库时跳过）', () => {
    const clientRoot = clientRootOrSkip()
    const client = clientRoot === null ? null : readClientCatalog(clientRoot)

    if (client === null) {
      
      console.warn('跳过漂移检查：本机没有客户端仓库（可用 SECRANDOM_PATH 指定）')
      return
    }

    
    expect(diffCatalog(client, CLIENT_SETTINGS_CATEGORIES)).toEqual([])
  })

  







  it('每个分类的分组与顺序都还是客户端侧边栏里的那一份（没有客户端仓库时跳过）', () => {
    const clientRoot = clientRootOrSkip()
    const client = clientRoot === null ? null : readClientCatalog(clientRoot)
    if (client === null) return

    expect(diffCatalogOrder(client, CLIENT_SETTINGS_CATEGORIES)).toEqual([])
  })

  



  it('分组标题的三语文案与客户端侧边栏逐字一致（没有客户端仓库时跳过）', () => {
    const clientRoot = clientRootOrSkip()
    const client = clientRoot === null ? null : readClientCatalog(clientRoot)
    if (client === null) return

    expect(diffGroupCaptions(client, CLIENT_SETTINGS_GROUPS, CONSOLE_GROUP_LABELS)).toEqual([])
  })
})
