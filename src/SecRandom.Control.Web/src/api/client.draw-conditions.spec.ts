import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, compactDrawConditions, compactDrawPayload } from './client'
import { DRAW_CONDITIONS_VERSION } from './protocol'












describe('compactDrawConditions', () => {
  it('没选任何条件时返回 null（调用方据此完全不发该键）', () => {
    expect(compactDrawConditions(undefined)).toBeNull()
    expect(compactDrawConditions({ version: 1 })).toBeNull()
    expect(compactDrawConditions({ version: 1, prize_tags: [] })).toBeNull()
    expect(compactDrawConditions({ version: 1, prize_tags: ['  '] })).toBeNull()
    expect(compactDrawConditions({ version: 1, student_list: '   ' })).toBeNull()
  })

  it('version 永远写当前协议版本，标签去空去重', () => {
    expect(compactDrawConditions({ version: 99, prize_tags: ['文具', ' 文具 ', ''] })).toEqual({
      version: DRAW_CONDITIONS_VERSION,
      prize_tags: ['文具', '文具'],
    })
    expect(DRAW_CONDITIONS_VERSION).toBe(1)
  })

  it('只有标签时**不发** student_list / gender / group', () => {
    const compacted = compactDrawConditions({ version: 1, prize_tags: ['书籍'] })
    expect(compacted).toEqual({ version: 1, prize_tags: ['书籍'] })
    expect(Object.keys(compacted ?? {})).toEqual(['version', 'prize_tags'])
  })

  it('gender / group 没有 student_list 就不发（协议要求同现）', () => {
    expect(compactDrawConditions({ version: 1, gender: '男', group: '第一组' })).toBeNull()

    const withList = compactDrawConditions({
      version: 1,
      prize_tags: ['文具'],
      student_list: '高一（1）班',
      gender: '男',
      group: '第一组',
    })
    expect(withList).toEqual({
      version: 1,
      prize_tags: ['文具'],
      student_list: '高一（1）班',
      gender: '男',
      group: '第一组',
    })
  })

  it('只选了发放对象时，不带空的 gender / group', () => {
    expect(compactDrawConditions({ version: 1, student_list: '高一（1）班' })).toEqual({
      version: 1,
      student_list: '高一（1）班',
    })
  })
})

describe('api.triggerDraw 的抽奖条件载荷', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function fakeResponse(body: unknown, status = 202) {
    return { status, ok: status < 400, text: async () => JSON.stringify(body) }
  }

  const issued = {
    command_id: 'cmd_draw',
    target_node_id: 'node_1',
    capability: 'draw.trigger',
    kind: 'action',
    status: 'queued',
    issued_at: '2026-10-04T13:20:00Z',
    expires_at: '2026-10-04T13:22:00Z',
  }

  async function bodyOf(payload: Parameters<typeof api.triggerDraw>[2]): Promise<unknown> {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) => fakeResponse(issued))
    vi.stubGlobal('fetch', fetchMock)
    await api.triggerDraw('grp_1', 'node_1', payload)
    const [, init] = fetchMock.mock.calls[0]!
    return JSON.parse(String(init?.body))
  }

  it('抽奖带条件时逐键比对（含 version 与嵌套 conditions）', async () => {
    const body = await bodyOf({
      target: 'lottery',
      list_name: '期末奖品',
      count: 3,
      conditions: {
        version: 1,
        prize_tags: ['文具', '书籍'],
        student_list: '高一（1）班',
        gender: '男',
        group: '第一组',
      },
    })

    expect(body).toEqual({
      capability: 'draw.trigger',
      kind: 'action',
      expires_in_seconds: 120,
      payload: {
        target: 'lottery',
        list_name: '期末奖品',
        count: 3,
        conditions: {
          version: 1,
          prize_tags: ['文具', '书籍'],
          student_list: '高一（1）班',
          gender: '男',
          group: '第一组',
        },
      },
    })
  })

  it('没选条件时**连 conditions 键都没有**（老行为逐字保留）', async () => {
    const body = (await bodyOf({ target: 'lottery', list_name: '期末奖品', count: 1 })) as Record<
      string,
      unknown
    >
    expect(body['payload']).toEqual({ target: 'lottery', list_name: '期末奖品', count: 1 })
    expect(Object.keys(body['payload'] as Record<string, unknown>)).not.toContain('conditions')
  })

  it('空标签不发 prize_tags；顶层 gender / group 对抽奖仍然不发', async () => {
    const body = (await bodyOf({
      target: 'lottery',
      list_name: '期末奖品',
      count: 2,
      conditions: { version: 1, prize_tags: [] },
    })) as Record<string, unknown>

    
    expect(Object.keys(body['payload'] as Record<string, unknown>)).not.toContain('conditions')
    
    expect(Object.keys(body['payload'] as Record<string, unknown>)).toEqual([
      'target',
      'count',
      'list_name',
    ])
  })

  it('compactDrawPayload 单独调用时同样带上裁剪后的 conditions', () => {
    expect(
      compactDrawPayload({
        target: 'lottery',
        conditions: { version: 1, prize_tags: ['文具'], student_list: ' 高一（1）班 ' },
      }),
    ).toEqual({
      target: 'lottery',
      conditions: { version: 1, prize_tags: ['文具'], student_list: '高一（1）班' },
    })
  })
})
