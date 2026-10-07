import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, buildMediaPlayPayload } from './client'













describe('media.play 载荷', () => {
  it('没有选项时，payload 与从前逐字相同（只有 action 与 text）', () => {
    expect(buildMediaPlayPayload('announce', '请第一组上台')).toEqual({
      action: 'announce',
      text: '请第一组上台',
    })
  })

  it('未给的键一个都不出现：系统音量没选，就不能变成 0', () => {
    const payload = buildMediaPlayPayload('announce', '上课了', {
      show_quick_draw_window: false,
      voice_volume_percent: 30,
    })

    expect(payload).toEqual({
      action: 'announce',
      text: '上课了',
      show_quick_draw_window: false,
      voice_volume_percent: 30,
    })
    expect('system_volume_percent' in payload).toBe(false)
  })

  it('0 是合法取值（静音），必须照发而不是被当成"没给"', () => {
    expect(
      buildMediaPlayPayload('announce', '静音播报', {
        system_volume_percent: 0,
        voice_volume_percent: 0,
      }),
    ).toEqual({
      action: 'announce',
      text: '静音播报',
      system_volume_percent: 0,
      voice_volume_percent: 0,
    })
  })

  it('闪抽窗口的 false 是明确的"这次不打开"', () => {
    expect(buildMediaPlayPayload('announce', '播报', { show_quick_draw_window: false })).toEqual({
      action: 'announce',
      text: '播报',
      show_quick_draw_window: false,
    })
  })
})

describe('api.playMedia', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  
  function fakeResponse(body: unknown) {
    return { status: 200, ok: true, text: async () => JSON.stringify(body) }
  }

  it('选项进 payload，正文与动作照旧', async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) =>
      fakeResponse({ command_id: 'cmd_1' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await api.playMedia('grp_1', 'node_1', 'announce', '请第一组上台', {
      show_quick_draw_window: true,
      system_volume_percent: 40,
    })

    const [path, init] = fetchMock.mock.calls[0]!
    expect(path).toBe('/v1/groups/grp_1/nodes/node_1/commands')
    expect(JSON.parse(String(init?.body))).toEqual({
      capability: 'media.play',
      kind: 'action',
      expires_in_seconds: 120,
      payload: {
        action: 'announce',
        text: '请第一组上台',
        show_quick_draw_window: true,
        system_volume_percent: 40,
      },
    })
  })

  it('不传选项时请求体里没有那些键（旧控制台的载荷逐字不变）', async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) =>
      fakeResponse({ command_id: 'cmd_2' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await api.playMedia('grp_1', 'node_1', 'announce', '下课了')

    const [, init] = fetchMock.mock.calls[0]!
    expect(JSON.parse(String(init?.body)).payload).toEqual({ action: 'announce', text: '下课了' })
  })
})
