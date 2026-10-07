import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSessionStore } from './session'
import { api, ApiError } from '@/api/client'
import type { CurrentUser, GroupRole, GroupSummary } from '@/api/protocol'


vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: { ...actual.api, session: vi.fn(), saveGroupOrder: vi.fn() },
  }
})

function group(id: string, ownerUserId: string, role: GroupRole): GroupSummary {
  return {
    group_id: id,
    name: `组 ${id}`,
    owner_user_id: ownerUserId,
    owner_display_name: ownerUserId === 'u-1' ? '张老师' : '李老师',
    created_at: '2026-01-01T00:00:00Z',
    role,
  }
}

const first = group('grp_a', 'u-1', 'owner')
const second = group('grp_b', 'u-1', 'owner')
const third = group('grp_c', 'u-2', 'operator')

function sessionWith(groups: GroupSummary[], maxOwnedGroups?: number): ReturnType<typeof useSessionStore> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const session = useSessionStore(pinia)
  const user: CurrentUser = {
    user_id: 'u-1',
    display_name: '张老师',
    groups,
    ...(maxOwnedGroups === undefined ? {} : { max_owned_groups: maxOwnedGroups }),
  }
  session.user = user
  session.loaded = true

  return session
}

describe('会话 store：分区与配额', () => {
  it('按拥有关系分区，顺序沿用服务端返回的顺序', () => {
    const session = sessionWith([second, third, first])

    expect(session.ownedGroups.map((item) => item.group_id)).toEqual(['grp_b', 'grp_a'])
    expect(session.joinedGroups.map((item) => item.group_id)).toEqual(['grp_c'])
    expect(session.ownedGroupCount).toBe(2)
  })

  it('建组上限来自服务端；缺失或 <= 0 视为不限制', () => {
    expect(sessionWith([first], 100).groupLimit).toBe(100)
    expect(sessionWith([first], 0).groupLimit).toBeNull()
    expect(sessionWith([first]).groupLimit).toBeNull()
  })

  it('拥有的组数达到上限时标记为已到顶', () => {
    const session = sessionWith([first, second], 2)

    expect(session.groupLimitReached).toBe(true)
  })
})

describe('会话 store：保存组顺序', () => {
  beforeEach(() => {
    vi.mocked(api.saveGroupOrder).mockReset()
    vi.mocked(api.session).mockReset()
  })

  it('先乐观更新本地顺序，再把整份顺序发给服务端', async () => {
    const session = sessionWith([first, second, third])
    vi.mocked(api.saveGroupOrder).mockResolvedValue(undefined)

    await session.saveGroupOrder(['grp_c', 'grp_a', 'grp_b'])

    
    expect(session.groups.map((item) => item.group_id)).toEqual(['grp_c', 'grp_a', 'grp_b'])
    expect(api.saveGroupOrder).toHaveBeenCalledWith(['grp_c', 'grp_a', 'grp_b'])
  })

  it('保存失败时拉回服务端顺序，并把错误抛给调用方', async () => {
    const session = sessionWith([first, second])
    vi.mocked(api.saveGroupOrder).mockRejectedValue(new ApiError('network_error', 0))
    
    vi.mocked(api.session).mockResolvedValue({
      user_id: 'u-1',
      display_name: '张老师',
      groups: [first, second],
    })

    await expect(session.saveGroupOrder(['grp_b', 'grp_a'])).rejects.toBeInstanceOf(ApiError)

    
    expect(api.session).toHaveBeenCalled()
    expect(session.groups.map((item) => item.group_id)).toEqual(['grp_a', 'grp_b'])
  })

  it('未登录时不发请求', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const session = useSessionStore(pinia)

    await session.saveGroupOrder(['grp_a'])

    expect(api.saveGroupOrder).not.toHaveBeenCalled()
  })
})
