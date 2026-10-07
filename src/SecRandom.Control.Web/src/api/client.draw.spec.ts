import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, compactDrawPayload } from './client'












describe('compactDrawPayload', () => {
  it('空请求保持空对象：一个键都不凭空造出来', () => {
    expect(compactDrawPayload({})).toEqual({})
  })

  it('空的名单名 / 条件等于没给（不写 key，也不写空串）', () => {
    const payload = compactDrawPayload({ target: 'roll_call', list_name: '   ', gender: '', group: '' })

    expect(payload).toEqual({ target: 'roll_call' })
    expect('list_name' in payload).toBe(false)
    expect('gender' in payload).toBe(false)
    expect('group' in payload).toBe(false)
  })

  it('有值的字段照发，并去掉首尾空白', () => {
    expect(
      compactDrawPayload({
        target: 'roll_call',
        list_name: ' 高一（1）班 ',
        gender: ' 男 ',
        group: 'A组',
        count: 3,
      }),
    ).toEqual({ target: 'roll_call', list_name: '高一（1）班', gender: '男', group: 'A组', count: 3 })
  })

  it('count 为 1 也照发：它是真实的取值，不是"默认值"', () => {
    expect(compactDrawPayload({ target: 'roll_call', count: 1 })).toEqual({ target: 'roll_call', count: 1 })
  })
})

describe('api.triggerDraw', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  
  function fakeResponse(body: unknown) {
    return { status: 200, ok: true, text: async () => JSON.stringify(body) }
  }

  it('不带参数时请求体里没有 payload 键（旧控制台逐字一致）', async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) =>
      fakeResponse({ command_id: 'cmd_1' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await api.triggerDraw('grp_1', 'node_1')

    const [path, init] = fetchMock.mock.calls[0]!
    expect(path).toBe('/v1/groups/grp_1/nodes/node_1/commands')
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    expect(body).toEqual({ capability: 'draw.trigger', kind: 'action', expires_in_seconds: 120 })
    expect('payload' in body).toBe(false)
  })

  it('带参数时 payload 只含有值的字段', async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) =>
      fakeResponse({ command_id: 'cmd_2' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await api.triggerDraw('grp_1', 'node_1', { target: 'roll_call', list_name: '大名单', count: 2 })

    const [, init] = fetchMock.mock.calls[0]!
    expect(JSON.parse(String(init?.body))).toEqual({
      capability: 'draw.trigger',
      kind: 'action',
      expires_in_seconds: 120,
      payload: { target: 'roll_call', list_name: '大名单', count: 2 },
    })
  })
})
