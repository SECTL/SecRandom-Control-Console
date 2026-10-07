import { describe, expect, it } from 'vitest'
import {
  CLIENT_SETTING_OPTION_EXCEPTIONS,
  CLIENT_SETTING_OPTION_LABELS,
  CLIENT_SETTING_OPTION_LABELS_SOURCE,
  CLIENT_SETTING_OPTION_LABELS_SOURCE_INFO,
  CLIENT_SETTING_OPTION_LANGUAGES,
  optionLabelOf,
  optionLabelsOf,
} from './client-setting-option-labels'
import { CLIENT_SETTINGS_PAGES, isClientSettingContainer, type ClientSettingRow, type ClientSettingValueRow } from './client-settings-pages'

import {
  missingSourceFiles,
  readClientResx,
  readComboBoxOptions,
  resolveClientRoot,
  RESX_LANGUAGE_FILES,
} from '../../scripts/client-catalog-drift.mjs'




















function flattenRows(rows: readonly ClientSettingRow[]): ClientSettingValueRow[] {
  return rows.flatMap((row) =>
    isClientSettingContainer(row) ? flattenRows(row.rows) : [row, ...flattenRows(row.rows ?? [])],
  )
}


function memberNamesOf(row: ClientSettingValueRow): string[] {
  return (row.options ?? []).filter((entry): entry is string => typeof entry === 'string')
}









function carriesOwnLabels(row: ClientSettingValueRow): boolean {
  return (row.options ?? []).some((entry) => typeof entry !== 'string')
}

const ROWS = CLIENT_SETTINGS_PAGES.flatMap((page) =>
  page.sections.flatMap((section) =>
    flattenRows(section.rows).map((row) => ({ pageId: page.id, row })),
  ),
)
const SELECT_ROWS = ROWS.filter((entry) => entry.row.control === 'select')


function resolveClient() {
  
  
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  const clientRoot = env?.['SECRANDOM_PATH'] ?? resolveClientRoot()
  if (clientRoot === null) {
    console.warn('跳过漂移检查：找不到客户端仓库（可用 SECRANDOM_PATH 指定）')
    return null
  }

  
  const probe = readClientResx(
    `${clientRoot}/SecRandom/Langs/SettingsPages/Picking`,
  )
  if (probe === null) {
    console.warn(`跳过漂移检查：找不到 ${clientRoot}（可用 SECRANDOM_PATH 指定）`)
    return null
  }
  return { clientRoot, probe }
}

describe('客户端下拉选项文案表', () => {
  it('每个 select 行都有文案表条目，且没有多余的条目', () => {
    const selectPaths = new Set(SELECT_ROWS.map((entry) => entry.row.path))

    for (const { pageId, row } of SELECT_ROWS) {
      
      if (carriesOwnLabels(row)) continue
      const labels = optionLabelsOf(row.path)
      expect(labels, `${pageId} / ${row.path} 是下拉却没有选项文案`).toBeDefined()
      expect(
        Object.keys(labels ?? {}).length,
        `${pageId} / ${row.path} 的选项文案表是空的`,
      ).toBeGreaterThan(0)
    }

    
    
    const orphanPaths = Object.keys(CLIENT_SETTING_OPTION_LABELS).filter(
      (path) => !selectPaths.has(path),
    )
    expect(
      orphanPaths,
      `这些路径不再是下拉行（或已从快照删除），请从 CLIENT_SETTING_OPTION_LABELS 删掉：${orphanPaths.join('、')}`,
    ).toEqual([])
  })

  it('每个成员都有非空的三语文案，且没有全是空文案的成员', () => {
    let memberCount = 0

    for (const [path, labels] of Object.entries(CLIENT_SETTING_OPTION_LABELS)) {
      for (const [member, byLanguage] of Object.entries(labels)) {
        memberCount += 1
        const where = `${path} / ${member}`
        
        expect(member.length, `${path} 有一个空的成员名`).toBeGreaterThan(0)

        const filled = CLIENT_SETTING_OPTION_LANGUAGES.filter(
          (language) => (byLanguage[language] ?? '').length > 0,
        )
        expect(
          filled.length,
          `${where} 一个语种都没有文案：要么补上，要么把这一条删掉（成员会被当成没有文案）`,
        ).toBeGreaterThan(0)

        
        for (const language of CLIENT_SETTING_OPTION_LANGUAGES) {
          const text = byLanguage[language]
          if (text === undefined) continue
          expect(text.trim().length, `${where} 的 ${language} 文案只有空白`).toBeGreaterThan(0)
        }
      }
    }

    expect(memberCount).toBeGreaterThan(0)
  })

  it('出处的成员与文案表的成员一一对应', () => {
    const labelPaths = Object.keys(CLIENT_SETTING_OPTION_LABELS)
    const sourcePaths = Object.keys(CLIENT_SETTING_OPTION_LABELS_SOURCE)

    
    
    expect(
      sourcePaths.filter((path) => !labelPaths.includes(path)),
      '出处表里有文案表没有的路径',
    ).toEqual([])
    expect(
      labelPaths.filter((path) => !sourcePaths.includes(path)),
      '文案表里有出处表没有的路径：请补上资源键，否则漂移检查覆盖不到它',
    ).toEqual([])

    for (const path of labelPaths) {
      const labels = CLIENT_SETTING_OPTION_LABELS[path] ?? {}
      const source = CLIENT_SETTING_OPTION_LABELS_SOURCE[path]
      expect(source, `${path} 没有出处记录`).toBeDefined()
      if (source === undefined) continue

      expect(
        source.entries.map((entry) => entry.member).sort(),
        `${path} 的出处成员与文案成员对不上`,
      ).toEqual(Object.keys(labels).sort())

      for (const entry of source.entries) {
        const byLanguage = labels[entry.member]
        expect(byLanguage, `${path} / ${entry.member} 在文案表里不存在`).toBeDefined()

        const keyCount = Object.values(entry.resourceKey ?? {}).filter(
          (key) => key !== undefined,
        ).length
        
        if (entry.literal === true) {
          expect(
            keyCount,
            `${path} / ${entry.member} 标成了代码字面量，却又记着资源键：请二选一`,
          ).toBe(0)
        }

        for (const language of CLIENT_SETTING_OPTION_LANGUAGES) {
          const text = byLanguage?.[language]
          const key = entry.resourceKey?.[language]
          if (text === undefined) {
            
            expect(
              key,
              `${path} / ${entry.member} 的 ${language} 没有文案却记了资源键 ${key}`,
            ).toBeUndefined()
            continue
          }
          if (key !== undefined) continue
          
          
          
          
          const explained = entry.literal === true || keyCount > 0
          expect(
            explained,
            `${path} / ${entry.member} 的 ${language} 有文案「${text}」却没有任何资源键：` +
              '漂移检查就查不到它了（文案是客户端代码里的字面量时请标 literal: true）',
          ).toBe(true)
        }
      }
    }
  })

  it('例外表的条目写清了原因，且不与文案表重叠', () => {
    const seen = new Set<string>()

    for (const entry of CLIENT_SETTING_OPTION_EXCEPTIONS) {
      const id = `${entry.path}#${entry.member}`
      
      expect(entry.reason.length, `${id} 没有写清为什么保留原始名`).toBeGreaterThan(0)
      expect(seen.has(id), `${id} 在例外表里出现了两次`).toBe(false)
      seen.add(id)

      
      expect(
        optionLabelOf(entry.path, entry.member, 'zh-CN'),
        `${id} 已经有三语文案了，不该再列为例外`,
      ).toBeUndefined()
    }
  })

  it('覆盖：每个下拉成员都有文案或一条例外', () => {
    const exceptions = new Set(
      CLIENT_SETTING_OPTION_EXCEPTIONS.map((entry) => `${entry.path}#${entry.member}`),
    )

    const missing = []
    for (const { row } of SELECT_ROWS) {
      
      
      for (const member of memberNamesOf(row)) {
        const labelled = optionLabelOf(row.path, member, 'zh-CN') !== undefined
        if (!labelled && !exceptions.has(`${row.path}#${member}`)) missing.push(`${row.path}#${member}`)
      }
    }

    expect(
      missing,
      '这些下拉成员既没有文案也没有例外记录：补上客户端文案，或者加进 CLIENT_SETTING_OPTION_EXCEPTIONS 写清理由',
    ).toEqual([])
  })

  it('每个成员都至少覆盖中文（中文是客户端基资源，缺了说明抄漏了）', () => {
    const partial = []
    for (const [path, labels] of Object.entries(CLIENT_SETTING_OPTION_LABELS)) {
      for (const [member, byLanguage] of Object.entries(labels)) {
        if ((byLanguage['zh-CN'] ?? '').length === 0) partial.push(`${path}#${member}`)
      }
    }
    expect(partial, `这些成员没有中文文案：${partial.join('、')}`).toEqual([])
  })

  it('出处记录了客户端提交号与核对过的文件', () => {
    expect(CLIENT_SETTING_OPTION_LABELS_SOURCE_INFO.repo).toBe('SecRandom')
    expect(CLIENT_SETTING_OPTION_LABELS_SOURCE_INFO.clientCommit).toMatch(/^[0-9a-f]{7,40}$/)
    expect(CLIENT_SETTING_OPTION_LABELS_SOURCE_INFO.files.length).toBeGreaterThan(0)

    for (const file of CLIENT_SETTING_OPTION_LABELS_SOURCE_INFO.files) {
      
      expect(file, `出处清单里的「${file}」不是仓库相对路径`).toMatch(/^[\w.-]+(\/[\w.-]+)+$/)
    }
  })

  it('查表函数在没有这一条时返回 undefined 而不是编造', () => {
    expect(optionLabelsOf('roll_call.draw_mode')).toBeDefined()
    expect(optionLabelsOf('roll_call.half_repeat')).toBeUndefined()
    expect(optionLabelOf('roll_call.draw_mode', 'NoRepeat', 'ja-JP')).toBe('重複なし')
    expect(optionLabelOf('roll_call.draw_mode', 'NotAMember', 'zh-CN')).toBeUndefined()
    expect(optionLabelOf('nope.nope', 'NoRepeat', 'zh-CN')).toBeUndefined()
  })

  it('三语标签与资源文件名表对齐', () => {
    
    
    expect([...CLIENT_SETTING_OPTION_LANGUAGES].sort()).toEqual(
      Object.keys(RESX_LANGUAGE_FILES).sort(),
    )
    expect(Object.keys(RESX_LANGUAGE_FILES)).toEqual(['zh-CN', 'en-US', 'ja-JP'])
  })
})

describe('客户端下拉选项文案表与真实客户端源码', () => {
  it('出处清单里的客户端文件都还在（没有客户端仓库时跳过）', () => {
    const resolved = resolveClient()
    if (resolved === null) return

    expect(missingSourceFiles(resolved.clientRoot, CLIENT_SETTING_OPTION_LABELS_SOURCE_INFO.files)).toEqual(
      [],
    )
  })

  it('每个记下的资源键都还在，且文案一字不差（没有客户端仓库时跳过）', () => {
    const resolved = resolveClient()
    if (resolved === null) return

    const problems: string[] = []
    const resxCache = new Map<string, ReturnType<typeof readClientResx>>()

    for (const [path, source] of Object.entries(CLIENT_SETTING_OPTION_LABELS_SOURCE)) {
      if (source.resourceDirectory === null) continue

      let table = resxCache.get(source.resourceDirectory)
      if (table === undefined) {
        table = readClientResx(`${resolved.clientRoot}/${source.resourceDirectory}`)
        resxCache.set(source.resourceDirectory, table)
      }
      if (table === null) {
        problems.push(`${path}: 读不到资源目录 ${source.resourceDirectory}`)
        continue
      }

      const labels = CLIENT_SETTING_OPTION_LABELS[path] ?? {}
      for (const entry of source.entries) {
        for (const language of CLIENT_SETTING_OPTION_LANGUAGES) {
          const expected = labels[entry.member]?.[language]
          const key = entry.resourceKey?.[language]
          if (expected === undefined || key === undefined) continue

          const actual = table[language]?.[key]
          if (actual === undefined) {
            problems.push(
              `${path} / ${entry.member} (${language}): 资源键 ${key} 在 ` +
                `${source.resourceDirectory}/${RESX_LANGUAGE_FILES[language]} 里已不存在`,
            )
          } else if (actual !== expected) {
            problems.push(
              `${path} / ${entry.member} (${language}): 文案已变——客户端是「${actual}」，` +
                `这里记的是「${expected}」`,
            )
          }
        }
      }
    }

    expect(problems, problems.join('\n')).toEqual([])
  })

  it('每个下拉的资源键顺序仍与客户端 XAML 里的成员顺序一致（没有客户端仓库时跳过）', () => {
    const resolved = resolveClient()
    if (resolved === null) return

    const problems: string[] = []

    for (const [path, source] of Object.entries(CLIENT_SETTING_OPTION_LABELS_SOURCE)) {
      const xaml = source.xaml
      if (xaml === null) continue

      const combo = readComboBoxOptions(`${resolved.clientRoot}/${xaml.file}`, xaml.anchor)
      if (combo === null) {
        problems.push(`${path}: 在 ${xaml.file} 里找不到 x:Name="${xaml.anchor}" 下的 ComboBox`)
        continue
      }

      
      
      if (combo.property !== xaml.property) {
        problems.push(
          `${path}: ${xaml.anchor} 现在绑的是 ${combo.property ?? '（没有 SelectedIndex 绑定）'}，` +
            `记的是 ${xaml.property}：请确认下拉框换成了什么，并重新核对文案`,
        )
        continue
      }

      if (combo.resourceKeys.length !== source.entries.length) {
        problems.push(
          `${path}: 客户端下拉有 ${combo.resourceKeys.length} 项，文案表有 ${source.entries.length} 项：` +
            '成员增删了，请重新逐位核对',
        )
        continue
      }

      combo.resourceKeys.forEach((key, index) => {
        const entry = source.entries[index]
        if (entry === undefined) return
        const recorded = entry.resourceKey?.['zh-CN']
        if (recorded !== key) {
          problems.push(
            `${path} 第 ${index + 1} 项（${entry.member}）：客户端用的是 ${key ?? '（非静态选项）'}，` +
              `这里记的是 ${recorded ?? '（无）'}——顺序或键变了，请重新逐位核对`,
          )
        }
      })
    }

    expect(problems, problems.join('\n')).toEqual([])
  })

  it('部分语种缺失的成员必须与客户端资源现状一致（没有客户端仓库时跳过）', () => {
    const resolved = resolveClient()
    if (resolved === null) return

    
    const problems: string[] = []
    const resxCache = new Map<string, ReturnType<typeof readClientResx>>()

    for (const [path, source] of Object.entries(CLIENT_SETTING_OPTION_LABELS_SOURCE)) {
      if (source.resourceDirectory === null) continue
      let table = resxCache.get(source.resourceDirectory)
      if (table === undefined) {
        table = readClientResx(`${resolved.clientRoot}/${source.resourceDirectory}`)
        resxCache.set(source.resourceDirectory, table)
      }
      if (table === null) continue

      const labels = CLIENT_SETTING_OPTION_LABELS[path] ?? {}
      for (const entry of source.entries) {
        for (const language of CLIENT_SETTING_OPTION_LANGUAGES) {
          const hasLabel = (labels[entry.member]?.[language] ?? '').length > 0
          const key = entry.resourceKey?.[language]
          if (hasLabel === (key !== undefined)) continue

          if (hasLabel) {
            
            
            if (entry.literal !== true) {
              problems.push(`${path} / ${entry.member} (${language}): 有文案却没有资源键`)
            }
            continue
          }

          
          problems.push(
            `${path} / ${entry.member} (${language}): 客户端资源里有 ${key}，` +
              '这里却没有文案——像是漏抄了一语（若客户端显示的就是成员名，请加进例外表）',
          )
        }
      }
    }

    expect(problems, problems.join('\n')).toEqual([])
  })
})
