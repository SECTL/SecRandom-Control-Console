import { describe, expect, it } from 'vitest'
import {
  batchDraftIncluded,
  buildBatchConfigPlan,
  collectBatchConfigRows,
  emptyBatchConfigDraft,
  type BatchConfigDraft,
  type BatchConfigRow,
} from './batch-config'
import {
  CLIENT_SETTINGS_PAGES,
  isClientSettingContainer,
  type ClientSettingRow,
  type ClientSettingsPage,
} from '@/data/client-settings-pages'









const PAGE: ClientSettingsPage = {
  id: 'demo',
  title: '演示页',
  groupId: 'personalized',
  icon: 'DemoFilled',
  sections: [
    {
      id: 'main',
      title: '主段落',
      rows: [
        { path: 'demo.toggle', labels: { 'zh-CN': '开关' }, icon: 'I', control: 'toggle' },
        {
          path: 'demo.select',
          labels: { 'zh-CN': '下拉' },
          icon: 'I',
          control: 'select',
          options: ['One', 'Two'],
        },
        {
          kind: 'container',
          id: 'nested',
          labels: { 'zh-CN': '容器' },
          icon: 'I',
          rows: [
            { path: 'demo.text', labels: { 'zh-CN': '文本' }, icon: 'I', control: 'text' },
            {
              path: 'demo.number',
              labels: { 'zh-CN': '数字' },
              icon: 'I',
              control: 'number',
            },
            {
              path: 'demo.locked',
              labels: { 'zh-CN': '只读项' },
              icon: 'I',
              control: 'text',
              readonly: true,
            },
          ],
        },
        {
          
          path: 'demo.override',
          labels: { 'zh-CN': '覆盖这一块' },
          icon: 'I',
          control: 'toggle',
          rows: [
            {
              path: 'demo.override_child',
              labels: { 'zh-CN': '覆盖里的项' },
              icon: 'I',
              control: 'number',
            },
            {
              path: 'demo.override_locked',
              labels: { 'zh-CN': '覆盖里的只读项' },
              icon: 'I',
              control: 'text',
              readonly: true,
            },
          ],
        },
      ],
    },
  ],
}

const ROWS = collectBatchConfigRows([PAGE])
const BY_PATH = new Map(ROWS.map((row) => [row.path, row]))

function rowOf(path: string): BatchConfigRow {
  const row = BY_PATH.get(path)
  if (row === undefined) throw new Error(`快照里没有 ${path}`)
  return row
}

function draft(partial: Partial<BatchConfigDraft>): BatchConfigDraft {
  return { ...emptyBatchConfigDraft(), ...partial }
}

describe('collectBatchConfigRows', () => {
  it('展开容器、按快照顺序拍平，并记下所属页面与段落', () => {
    expect(ROWS.map((row) => row.path)).toEqual([
      'demo.toggle',
      'demo.select',
      'demo.text',
      'demo.number',
      'demo.locked',
      'demo.override',
      'demo.override_child',
      'demo.override_locked',
    ])
    expect(ROWS.map((row) => row.sectionId)).toEqual(Array(8).fill('main'))
    expect(ROWS.map((row) => row.pageId)).toEqual(Array(8).fill('demo'))
  })

  it('**真实行的子项也要展开**（「可覆盖设置」那一类卡片，只认容器会静默丢行）', () => {
    expect(BY_PATH.has('demo.override_child')).toBe(true)
    expect(BY_PATH.has('demo.override_locked')).toBe(true)
  })

  it('把只读行标出来，而不是把它丢掉', () => {
    expect(rowOf('demo.locked').readonly).toBe(true)
    expect(rowOf('demo.text').readonly).toBe(false)
  })

  it('真实快照里：每一条可下发的设置项都在清单里，一条都不少', () => {
    
    
    
    const expected: string[] = []
    const walk = (row: ClientSettingRow): void => {
      if (!isClientSettingContainer(row)) expected.push(row.path)
      for (const child of row.rows ?? []) walk(child)
    }
    for (const page of CLIENT_SETTINGS_PAGES) {
      for (const section of page.sections) for (const row of section.rows) walk(row)
    }

    const all = collectBatchConfigRows(CLIENT_SETTINGS_PAGES)
    expect(new Set(all.map((row) => row.path))).toEqual(new Set(expected))
    
    
    expect(all).toHaveLength(231)
    expect(all.filter((row) => row.readonly)).toHaveLength(27)
    expect(all.filter((row) => !row.readonly)).toHaveLength(204)
  })

  it('真实快照里：每条可下发的下拉都有候选', () => {
    
    
    const selects = ROWS.filter((row) => row.control === 'select' && !row.readonly)

    expect(selects.length).toBeGreaterThan(0)
    for (const row of selects) expect(row.options.length, row.path).toBeGreaterThan(0)
  })
})

describe('batchDraftIncluded', () => {
  it('下拉型：空值就是「不改变」，与 include 无关', () => {
    expect(batchDraftIncluded(rowOf('demo.toggle'), draft({ include: true, value: '' }))).toBe(false)
    expect(batchDraftIncluded(rowOf('demo.toggle'), draft({ value: true }))).toBe(true)
    expect(batchDraftIncluded(rowOf('demo.select'), draft({ value: 'One' }))).toBe(true)
  })

  it('填写型：由 include 决定，值还没填也算「纳入」（那是一处待解决的空缺）', () => {
    expect(batchDraftIncluded(rowOf('demo.number'), draft({ include: false, value: 3 }))).toBe(false)
    expect(batchDraftIncluded(rowOf('demo.number'), draft({ include: true, value: '' }))).toBe(true)
  })

  it('只读项永远不纳入（`readonly` 标记与 `readonly` 控件都算）', () => {
    expect(batchDraftIncluded(rowOf('demo.locked'), draft({ include: true, value: 'x' }))).toBe(false)
    expect(
      batchDraftIncluded(
        { control: 'readonly', readonly: false },
        draft({ include: true, value: 'x' }),
      ),
    ).toBe(false)
  })
})

describe('buildBatchConfigPlan', () => {
  it('没有草稿时不发任何东西，并把只读项数出来', () => {
    const plan = buildBatchConfigPlan(ROWS, {})
    expect(plan.patch).toEqual({})
    expect(plan.included).toBe(0)
    expect(plan.problems).toEqual([])
    
    expect(plan.readonlyCount).toBe(2)
  })

  it('开关送布尔、下拉送成员名、数字送数字、文本去首尾空白', () => {
    const plan = buildBatchConfigPlan(ROWS, {
      'demo.toggle': draft({ value: false }),
      'demo.select': draft({ value: 'Two' }),
      'demo.number': draft({ include: true, value: '12' }),
      'demo.text': draft({ include: true, value: '  301班  ' }),
    })

    expect(plan.patch).toEqual({
      'demo.toggle': false,
      'demo.select': 'Two',
      'demo.number': 12,
      'demo.text': '301班',
    })
    expect(plan.problems).toEqual([])
    expect(plan.included).toBe(4)
  })

  it('没勾的项一个都不发：设备上保持原样', () => {
    const plan = buildBatchConfigPlan(ROWS, {
      'demo.toggle': draft({ include: true, value: '' }),
      'demo.text': draft({ include: false, value: '会被忽略' }),
    })
    expect(plan.patch).toEqual({})
    expect(plan.included).toBe(0)
  })

  it('填错的项落进 problems，且**不**出现在 patch 里', () => {
    const plan = buildBatchConfigPlan(ROWS, {
      'demo.select': draft({ value: 'Three' }),
      'demo.number': draft({ include: true, value: '十二' }),
      'demo.text': draft({ include: true, value: '   ' }),
      'demo.toggle': draft({ value: true }),
    })

    expect(plan.patch).toEqual({ 'demo.toggle': true })
    
    
    expect(plan.problems).toEqual([
      { path: 'demo.select', kind: 'notOption', options: ['One', 'Two'] },
      { path: 'demo.text', kind: 'missing', options: [] },
      { path: 'demo.number', kind: 'notNumber', options: [] },
    ])
    
    expect(plan.included).toBe(4)
  })

  it('文本：没填是问题，**明确清空**是一个要下发的空值', () => {
    const missing = buildBatchConfigPlan(ROWS, {
      'demo.text': draft({ include: true, value: '   ' }),
    })
    expect(missing.patch).toEqual({})
    expect(missing.problems).toEqual([{ path: 'demo.text', kind: 'missing', options: [] }])

    const cleared = buildBatchConfigPlan(ROWS, {
      'demo.text': draft({ include: true, value: '', cleared: true }),
    })
    expect(cleared.problems).toEqual([])
    
    
    expect(cleared.patch).toEqual({ 'demo.text': '' })
  })

  it('数字：勾了没填是问题（空值不是一个合法数字）', () => {
    const plan = buildBatchConfigPlan(ROWS, {
      'demo.number': draft({ include: true, value: '' }),
    })
    expect(plan.patch).toEqual({})
    expect(plan.problems).toEqual([{ path: 'demo.number', kind: 'missing', options: [] }])
  })

  it('只读项即使有草稿也不进 patch', () => {
    const plan = buildBatchConfigPlan(ROWS, {
      'demo.locked': draft({ include: true, value: '字体' }),
    })
    expect(plan.patch).toEqual({})
    expect(plan.included).toBe(0)
  })

  it('数字允许小数与负数（快照里没有区间，区间由设备自己判）', () => {
    const plan = buildBatchConfigPlan(ROWS, {
      'demo.number': draft({ include: true, value: '-2.5' }),
    })
    expect(plan.patch).toEqual({ 'demo.number': -2.5 })
    expect(plan.problems).toEqual([])
  })
})
