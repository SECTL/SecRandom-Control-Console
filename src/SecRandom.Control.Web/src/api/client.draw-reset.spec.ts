import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'
import { DEFAULT_ACTION_EXPIRES_SECONDS } from './protocol'














describe('api.resetDraw', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function fakeResponse(body: unknown, status = 202) {
    return { status, ok: status < 400, text: async () => JSON.stringify(body) }
  }

  const issued = {
    command_id: 'cmd_reset',
    target_node_id: 'node_1',
    capability: 'draw.reset',
    kind: 'action',
    status: 'queued',
    issued_at: '2026-10-04T13:20:00Z',
    expires_at: '2026-10-04T13:22:00Z',
  }

  it('按 draw.reset + action 下发，target 必填、list_name 省略即缺席', async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) => fakeResponse(issued))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.resetDraw('grp_1', 'node_1', 'roll_call')).resolves.toEqual(issued)

    const [path, init] = fetchMock.mock.calls[0]!
    expect(path).toBe('/v1/groups/grp_1/nodes/node_1/commands')
    expect(init?.method).toBe('POST')

    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    expect(body).toEqual({
      capability: 'draw.reset',
      kind: 'action',
      expires_in_seconds: DEFAULT_ACTION_EXPIRES_SECONDS,
      payload: { target: 'roll_call' },
    })
    
    expect(Object.keys(body['payload'] as Record<string, unknown>)).toEqual(['target'])
    expect(DEFAULT_ACTION_EXPIRES_SECONDS).toBe(120)
  })

  it('给了名单名就带上，并且去掉首尾空白', async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) => fakeResponse(issued))
    vi.stubGlobal('fetch', fetchMock)

    await api.resetDraw('grp_1', 'node_1', 'lottery', '  元旦奖池  ')

    const [, init] = fetchMock.mock.calls[0]!
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    expect(body['payload']).toEqual({ target: 'lottery', list_name: '元旦奖池' })
  })

  it('三个对象原样透传（快速抽取不在 DrawTarget 里，是独立的一组值）', async () => {
    const seen: unknown[] = []
    const fetchMock = vi.fn(async (_path: string, init?: RequestInit) => {
      seen.push((JSON.parse(String(init?.body)) as Record<string, unknown>)['payload'])
      return fakeResponse(issued)
    })
    vi.stubGlobal('fetch', fetchMock)

    await api.resetDraw('grp_1', 'node_1', 'roll_call')
    await api.resetDraw('grp_1', 'node_1', 'lottery')
    await api.resetDraw('grp_1', 'node_1', 'quick')

    expect(seen).toEqual([
      { target: 'roll_call' },
      { target: 'lottery' },
      { target: 'quick' },
    ])
  })
})
