import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'











describe('api.revokeCommand', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  
  function fakeResponse(body: unknown, status = 200) {
    return { status, ok: status < 400, text: async () => JSON.stringify(body) }
  }

  it('走 DELETE，路径与查询同一条，并回传撤销后的 DTO', async () => {
    const revoked = {
      command_id: 'cmd_1',
      target_node_id: 'node_1',
      capability: 'draw.trigger',
      kind: 'action',
      status: 'revoked',
      issued_at: '2026-10-04T13:20:00Z',
      expires_at: '2026-10-04T13:22:00Z',
    }
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) => fakeResponse(revoked))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.revokeCommand('grp_1', 'cmd_1')).resolves.toEqual(revoked)

    const [path, init] = fetchMock.mock.calls[0]!
    expect(path).toBe('/v1/groups/grp_1/commands/cmd_1')
    expect(init?.method).toBe('DELETE')
    
    expect(init?.body).toBeUndefined()
  })

  it('命令已经投递出去时，把 not_revocable 原样带出来', async () => {
    const fetchMock = vi.fn(async () => fakeResponse({ code: 'not_revocable' }, 409))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.revokeCommand('grp_1', 'cmd_1')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'not_revocable',
      status: 409,
    })
  })
})
