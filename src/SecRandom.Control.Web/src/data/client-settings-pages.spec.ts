import { describe, expect, it } from 'vitest'
import {
  CLIENT_SETTINGS_PAGES,
  CLIENT_SETTINGS_PAGES_SOURCE,
  CLIENT_SETTINGS_PATHS_WITHOUT_ROW,
  isClientSettingContainer,
  type ClientSettingContainerRow,
  type ClientSettingRow,
  type ClientSettingValueRow,
} from './client-settings-pages'
import { CLIENT_SETTINGS_CATEGORIES } from '@/utils/client-settings-catalog'

import {
  diffPageLayout,
  diffSettingsPagePaths,
  missingSourceFiles,
  readClientCatalog,
  readClientSettingsPaths,
  resolveClientRoot,
} from '../../scripts/client-catalog-drift.mjs'

















const OPERABLE_PAGE_IDS = [
  'appearance',
  'floating_window',
  'timer',
  'linkage',
  'default_draw',
  'roll_call',
  'quick_draw',
  'lottery',
  'notification',
  'voice',
  'more',
]


const CONTROLS = ['toggle', 'number', 'select', 'text', 'readonly', 'hotkey']









function flattenRows(rows: readonly ClientSettingRow[]): ClientSettingValueRow[] {
  return rows.flatMap((row) =>
    isClientSettingContainer(row) ? flattenRows(row.rows) : [row, ...flattenRows(row.rows ?? [])],
  )
}


function flattenContainers(rows: readonly ClientSettingRow[]): ClientSettingContainerRow[] {
  return rows.flatMap((row) =>
    isClientSettingContainer(row)
      ? [row, ...flattenContainers(row.rows)]
      : flattenContainers(row.rows ?? []),
  )
}


function optionValuesOf(row: ClientSettingValueRow): string[] {
  return (row.options ?? []).map((entry) => (typeof entry === 'string' ? entry : entry.value))
}

const ROWS = CLIENT_SETTINGS_PAGES.flatMap((page) =>
  page.sections.flatMap((section) =>
    flattenRows(section.rows).map((row) => ({ pageId: page.id, row })),
  ),
)

const CONTAINERS = CLIENT_SETTINGS_PAGES.flatMap((page) =>
  page.sections.flatMap((section) =>
    flattenContainers(section.rows).map((row) => ({ pageId: page.id, row })),
  ),
)


const CONDITIONAL_ROWS = CLIENT_SETTINGS_PAGES.flatMap((page) =>
  page.sections.flatMap((section) =>
    [...flattenRows(section.rows), ...flattenContainers(section.rows)]
      .filter((row) => row.visibleWhen !== undefined)
      .map((row) => ({ pageId: page.id, row })),
  ),
)


function resolveClient() {
  
  
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  const clientRoot = env?.['SECRANDOM_PATH'] ?? resolveClientRoot()
  if (clientRoot === null) {
    console.warn('跳过漂移检查：找不到客户端仓库（可用 SECRANDOM_PATH 指定）')
    return null
  }
  const client = readClientSettingsPaths(clientRoot)

  if (client === null) {
    
    console.warn(`跳过漂移检查：找不到 ${clientRoot}（可用 SECRANDOM_PATH 指定）`)
    return null
  }

  
  
  return { clientRoot, client, catalog: readClientCatalog(clientRoot) }
}

describe('客户端设置页快照', () => {
  it('只覆盖控制台真正能操作的那十页，而且顺序就是客户端侧边栏的顺序', () => {
    const ids = CLIENT_SETTINGS_PAGES.map((page) => page.id)
    expect([...ids].sort()).toEqual([...OPERABLE_PAGE_IDS].sort())

    






    expect(ids).toEqual([
      'appearance',
      'floating_window',
      'timer',
      'linkage',
      'more',
      'default_draw',
      'roll_call',
      'quick_draw',
      'lottery',
      'voice',
      'notification',
    ])

    for (const page of CLIENT_SETTINGS_PAGES) {
      expect(page.title.length, `${page.id} 没有页面标题`).toBeGreaterThan(0)
      expect(page.icon.length, `${page.id} 没有页面图标`).toBeGreaterThan(0)
      expect(
        ['personalized', 'picking', 'notification'],
        `${page.id} 的分组只可能是客户端的 personalized / picking / notification`,
      ).toContain(page.groupId)
      expect(page.sections.length, `${page.id} 一段都没有`).toBeGreaterThan(0)

      for (const section of page.sections) {
        expect(section.id.length, `${page.id} 有一段没有 id`).toBeGreaterThan(0)
        expect(section.title.length, `${page.id}/${section.id} 没有段落标题`).toBeGreaterThan(0)
        
        expect(
          section.rows.length,
          `${page.id}/${section.id} 是空段落`,
        ).toBeGreaterThan(0)
      }
    }
  })

  it('每一行都有协议路径、中文标题、图标与控件类型', () => {
    expect(ROWS.length).toBeGreaterThan(0)

    for (const { pageId, row } of ROWS) {
      const where = `${pageId} / ${row.path}`
      
      expect(row.path, `${where} 的 path 不像协议路径`).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)
      
      
      expect((row.labels['zh-CN'] ?? '').length, `${where} 没有中文标题`).toBeGreaterThan(0)
      expect(row.icon.length, `${where} 没有图标`).toBeGreaterThan(0)
      expect(CONTROLS, `${where} 的控件类型不认识`).toContain(row.control)

      if (row.descriptions !== undefined) {
        expect((row.descriptions['zh-CN'] ?? '').length, `${where} 的说明没有中文`).toBeGreaterThan(0)
      }
    }
  })

  it('下拉行的选项非空，其他控件不带选项', () => {
    for (const { pageId, row } of ROWS) {
      const where = `${pageId} / ${row.path}`
      if (row.control === 'select') {
        
        expect(row.options, `${where} 是 select 却没有选项`).toBeDefined()
        expect(optionValuesOf(row).length, `${where} 是 select 却没有选项`).toBeGreaterThan(0)

        for (const entry of row.options ?? []) {
          if (typeof entry === 'string') continue
          
          
          expect(entry.value.length, `${where} 的内置候选项没有值`).toBeGreaterThan(0)
          expect(
            Object.values(entry.labels).some((text) => (text ?? '').length > 0),
            `${where} 的内置候选项 ${entry.value} 一个语种的名字都没有`,
          ).toBe(true)
        }
      } else {
        expect(row.options, `${where} 不是 select 却带着 options`).toBeUndefined()
      }
    }
  })

  it('折叠分组容器没有协议路径、没有控件，只有组头与一列子项', () => {
    expect(CONTAINERS.length, '快照里一个折叠分组容器都没有了？').toBeGreaterThan(0)

    for (const { pageId, row } of CONTAINERS) {
      const where = `${pageId} / container:${row.id}`
      expect(row.kind, `${where} 的 kind 不是 container`).toBe('container')
      
      
      expect('path' in row, `${where} 不该有 path`).toBe(false)
      expect('control' in row, `${where} 不该有 control`).toBe(false)
      expect(row.id.length, `${where} 没有 id`).toBeGreaterThan(0)
      
      expect((row.labels['zh-CN'] ?? '').length, `${where} 没有中文标题`).toBeGreaterThan(0)
      expect(row.icon.length, `${where} 没有图标`).toBeGreaterThan(0)
      
      expect(row.rows.length, `${where} 是空组`).toBeGreaterThan(0)
    }

    
    
    for (const page of CLIENT_SETTINGS_PAGES) {
      for (const section of page.sections) {
        const ids = flattenContainers(section.rows).map((row) => row.id)
        expect(new Set(ids).size, `${page.id}/${section.id} 里有重名的容器 id：${ids.join('、')}`).toBe(
          ids.length,
        )
      }
    }
  })

  it('这一版刻意做成容器的三处都在（音乐设置 / OmniTTS / 通知服务）', () => {
    const containerIdsOf = (pageId: string): string[] =>
      flattenContainers(
        CLIENT_SETTINGS_PAGES.find((page) => page.id === pageId)?.sections.flatMap((s) => s.rows) ?? [],
      ).map((row) => row.id)

    
    expect(containerIdsOf('default_draw')).toContain('music')
    
    expect(containerIdsOf('voice')).toContain('omniTts')
    
    expect(containerIdsOf('notification')).toEqual([
      'notificationService',
      'notificationService',
      'notificationService',
      'notificationService',
    ])
    
    expect(containerIdsOf('floating_window')).toEqual(['enabledItems'])
    
    expect(containerIdsOf('more')).toEqual(['rollCallControls', 'lotteryControls'])
  })

  it('可见性条件都落在本页真实存在的行上，且恰好写 equals / notEquals 之一', () => {
    expect(CONDITIONAL_ROWS.length, '一条条件可见性都没有？').toBeGreaterThan(0)

    const pathsByPage = new Map<string, Set<string>>()
    for (const { pageId, row } of ROWS) {
      const bucket = pathsByPage.get(pageId) ?? new Set<string>()
      bucket.add(row.path)
      pathsByPage.set(pageId, bucket)
    }

    for (const { pageId, row } of CONDITIONAL_ROWS) {
      const visibility = row.visibleWhen
      if (visibility === undefined) continue
      const where = `${pageId} / ${isClientSettingContainer(row) ? `container:${row.id}` : row.path}`

      expect(visibility.all.length, `${where} 的可见性条件是一条空数组`).toBeGreaterThan(0)

      for (const condition of visibility.all) {
        const hasEquals = condition.equals !== undefined
        const hasNotEquals = condition.notEquals !== undefined
        expect(
          hasEquals !== hasNotEquals,
          `${where} 的条件 ${condition.path} 必须恰好写 equals 或 notEquals 之一`,
        ).toBe(true)
        
        
        expect(
          pathsByPage.get(pageId)?.has(condition.path),
          `${where} 的可见性条件指向了本页没有的路径 ${condition.path}`,
        ).toBe(true)
      }
    }
  })

  it('path 全站唯一', () => {
    const rowsByPath = new Map<string, string[]>()
    for (const { pageId, row } of ROWS) {
      rowsByPath.set(row.path, [...(rowsByPath.get(row.path) ?? []), pageId])
    }

    const duplicated = [...rowsByPath.entries()].filter(([, pages]) => pages.length > 1)
    expect(
      duplicated,
      `同一条协议路径出现在多页：${duplicated.map(([path, pages]) => `${path}（${pages.join('、')}）`).join('；')}`,
    ).toEqual([])
  })

  it('「页面上没有这一行」的表不与快照重叠', () => {
    const rowPaths = new Set(ROWS.map((entry) => entry.row.path))
    const seen = new Set<string>()

    for (const entry of CLIENT_SETTINGS_PATHS_WITHOUT_ROW) {
      
      expect(entry.reason.length, `${entry.path} 没有写清为什么页面上没有这一行`).toBeGreaterThan(0)
      expect(rowPaths.has(entry.path), `${entry.path} 快照里已经有这一行了，不该再排除`).toBe(false)
      expect(seen.has(entry.path), `${entry.path} 在排除表里出现了两次`).toBe(false)
      seen.add(entry.path)
    }
  })

  it('出处记录了客户端提交号与核对过的文件', () => {
    expect(CLIENT_SETTINGS_PAGES_SOURCE.repo).toBe('SecRandom')
    expect(CLIENT_SETTINGS_PAGES_SOURCE.clientCommit).toMatch(/^[0-9a-f]{7,40}$/)
    expect(CLIENT_SETTINGS_PAGES_SOURCE.files.length).toBeGreaterThan(0)

    for (const file of CLIENT_SETTINGS_PAGES_SOURCE.files) {
      
      expect(file, `出处清单里的「${file}」不是仓库相对路径`).toMatch(/^[\w.-]+(\/[\w.-]+)+$/)
    }
  })
})

describe('客户端设置页快照与真实客户端源码', () => {
  it('出处清单里的客户端文件都还在（没有客户端仓库时跳过）', () => {
    const resolved = resolveClient()
    if (resolved === null) return

    expect(missingSourceFiles(resolved.clientRoot, CLIENT_SETTINGS_PAGES_SOURCE.files)).toEqual([])
  })

  it('快照的每条 path 客户端都有，客户端这几类的每条设置也都有行（没有客户端仓库时跳过）', () => {
    const resolved = resolveClient()
    if (resolved === null) return

    
    expect(
      diffSettingsPagePaths(
        resolved.client,
        CLIENT_SETTINGS_PAGES,
        CLIENT_SETTINGS_PATHS_WITHOUT_ROW,
      ),
    ).toEqual([])
  })

  







  it('每一页的分组与页序都还是客户端侧边栏里的那一份（没有客户端仓库时跳过）', () => {
    const resolved = resolveClient()
    if (resolved === null || resolved.catalog === null) return

    
    
    const clientPageIdOf = Object.fromEntries(
      CLIENT_SETTINGS_CATEGORIES.map((entry) => [entry.id, entry.clientPageId]),
    )

    expect(diffPageLayout(resolved.catalog, CLIENT_SETTINGS_PAGES, clientPageIdOf)).toEqual([])
  })
})
