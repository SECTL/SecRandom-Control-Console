import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import GroupMembersPanel from './GroupMembersPanel.vue'
import { createAppI18n } from '@/i18n'
import { api } from '@/api/client'
import { pickOption } from '@/components/client/fluent/client-select.test-utils'
import type { MemberDto } from '@/api/protocol'





vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, api: { ...actual.api, changeMemberRole: vi.fn() } }
})









const GROUP_ID = 'grp_01ab30b332e6'

function member(userId: string, displayName?: string, avatarUrl?: string): MemberDto {
  return {
    user_id: userId,
    
    ...(displayName === undefined ? {} : { display_name: displayName }),
    ...(avatarUrl === undefined ? {} : { avatar_url: avatarUrl }),
    role: 'viewer',
    joined_at: '2026-10-04T11:51:22Z',
    is_self: false,
  }
}

function mountPanel(members: MemberDto[]): VueWrapper {
  return mount(GroupMembersPanel, {
    props: { groupId: GROUP_ID, members, loading: false, errorCode: null, isOwner: false },
    global: { plugins: [createAppI18n('zh-CN')] },
  })
}


enableAutoUnmount(afterEach)

describe('GroupMembersPanel 头像', () => {
  it('有头像地址时渲染 SECTL 头像，并带上 no-referrer', () => {
    const wrapper = mountPanel([member('u-1', '张老师', 'https://sectl.example/a.png')])

    const avatar = wrapper.get('li img')
    expect(avatar.attributes('src')).toBe('https://sectl.example/a.png')
    
    expect(avatar.attributes('referrerpolicy')).toBe('no-referrer')
  })

  it('头像加载失败时只回落他自己那一行，别人的头像不受影响', async () => {
    const wrapper = mountPanel([
      member('u-1', '张老师', 'https://sectl.example/broken.png'),
      member('u-2', '李老师', 'https://sectl.example/ok.png'),
    ])

    const rows = wrapper.findAll('li')
    await rows[0]!.get('img').trigger('error')

    
    expect(rows[0]!.find('img').exists()).toBe(false)
    expect(rows[0]!.text()).toContain('张')

    
    expect(rows[1]!.get('img').attributes('src')).toBe('https://sectl.example/ok.png')
  })

  it('没有头像时用昵称首字母，而不是通用占位图标', () => {
    const wrapper = mountPanel([member('u-1', '张老师')])

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('li').text()).toContain('张')
    expect(wrapper.find('li svg').exists()).toBe(false)
  })

  it('既没有头像也没有昵称时：占位图标 + 裸 user_id，绝不空白', () => {
    const wrapper = mountPanel([member('user_69c78f81003173a586ca')])

    const row = wrapper.get('li')
    expect(row.text()).toContain('user_69c78f81003173a586ca')
    expect(row.find('svg').exists()).toBe(true)
    expect(row.find('img').exists()).toBe(false)
  })

  it('昵称只有空白时视为没有昵称，回落到 user_id 与占位图标', () => {
    
    
    const wrapper = mountPanel([member('user_blank_name', '   ')])

    const row = wrapper.get('li')
    expect(row.text()).toContain('user_blank_name')
    expect(row.find('svg').exists()).toBe(true)
  })
})

describe('GroupMembersPanel 改角色', () => {
  beforeEach(() => {
    vi.mocked(api.changeMemberRole).mockReset()
  })

  






  it('角色那一格：选中后按新角色下发', async () => {
    vi.mocked(api.changeMemberRole).mockResolvedValue({ user_id: 'u-2', role: 'operator' })
    const wrapper = mountPanel([
      { ...member('u-1', '张老师'), role: 'owner', is_self: true },
      { ...member('u-2', '李老师'), role: 'viewer' },
    ])

    await pickOption(wrapper.get('[data-testid="member-role-u-2"]'), '操作者')
    await flushPromises()

    expect(api.changeMemberRole).toHaveBeenCalledWith(GROUP_ID, 'u-2', 'operator')
  })
})
