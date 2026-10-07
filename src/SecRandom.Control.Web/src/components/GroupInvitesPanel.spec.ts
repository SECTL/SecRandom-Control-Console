import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GroupInvitesPanel from './GroupInvitesPanel.vue'
import { api } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import { createAppI18n } from '@/i18n'
import { pickOption } from '@/components/client/fluent/client-select.test-utils'
import type { CurrentUser, InviteDto, MemberDto } from '@/api/protocol'

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, api: { ...actual.api, listInvites: vi.fn(), createInvite: vi.fn() } }
})

const GROUP_ID = 'grp_01ab30b332e6'

const invite: InviteDto = {
  code: 'K7QM3XZP',
  display_code: 'K7QM-3XZP',
  role: 'operator',
  created_by_user_id: 'user_owner_1',
  created_at: '2026-03-12T00:00:00Z',
  expires_at: '2026-03-14T18:00:00Z',
  status: 'pending',
}

const signedInUser: CurrentUser = {
  user_id: 'user_owner_1',
  display_name: '张老师',
  groups: [
    {
      group_id: GROUP_ID,
      name: '高一（1）班',
      owner_user_id: 'user_owner_1',
      owner_display_name: '张老师',
      created_at: '2026-03-12T00:00:00Z',
      role: 'owner',
    },
  ],
}

function member(userId: string, displayName?: string): MemberDto {
  return {
    user_id: userId,
    
    ...(displayName === undefined ? {} : { display_name: displayName }),
    role: 'owner',
    joined_at: '2026-03-12T00:00:00Z',
    is_self: false,
  }
}

async function mountPanel(members: MemberDto[]): Promise<VueWrapper> {
  const pinia = createPinia()
  setActivePinia(pinia)

  vi.mocked(api.listInvites).mockResolvedValue([invite])

  const session = useSessionStore(pinia)
  session.user = signedInUser
  session.loaded = true

  const wrapper = mount(GroupInvitesPanel, {
    props: { groupId: GROUP_ID, members },
    global: { plugins: [pinia, createAppI18n('zh-CN')] },
  })

  await flushPromises()
  return wrapper
}


enableAutoUnmount(afterEach)

describe('GroupInvitesPanel 创建者', () => {
  beforeEach(() => {
    vi.mocked(api.listInvites).mockReset()
    vi.mocked(api.createInvite).mockReset()
  })

  it('把发邀请的人解析成昵称，而不是显示裸 user_id', async () => {
    const wrapper = await mountPanel([member('user_owner_1', '张老师')])

    const creator = wrapper.get('[data-testid="invite-creator"]')
    expect(creator.text()).toContain('创建者')
    expect(creator.text()).toContain('张老师')
    expect(creator.text()).not.toContain('user_owner_1')
  })

  it('创建者已退组（查不到昵称）时显示 user_id 而不是组 ID', async () => {
    const wrapper = await mountPanel([member('someone_else', '李老师')])

    const creator = wrapper.get('[data-testid="invite-creator"]')
    expect(creator.text()).toContain('user_owner_1')
    expect(creator.text()).not.toContain(GROUP_ID)
  })

  



  it('角色那一格：选中后创建邀请带的是它', async () => {
    vi.mocked(api.createInvite).mockResolvedValue(invite)
    const wrapper = await mountPanel([member('user_owner_1', '张老师')])

    
    await pickOption(wrapper.get('[data-testid="invite-role"]'), '管理员')
    await wrapper.get('[data-testid="invite-create"]').trigger('click')
    await flushPromises()

    expect(api.createInvite).toHaveBeenCalledWith(GROUP_ID, 'admin')
  })
})
