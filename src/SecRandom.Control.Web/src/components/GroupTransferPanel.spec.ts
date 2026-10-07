import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, type Ref } from 'vue'
import GroupTransferPanel from './GroupTransferPanel.vue'
import { api } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import { createAppI18n } from '@/i18n'
import { pickOption } from '@/components/client/fluent/client-select.test-utils'
import type { CurrentUser, GroupRole, MemberDto, PendingTransfer, TransferDto } from '@/api/protocol'





vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: {
      ...actual.api,
      session: vi.fn(),
      pendingTransfer: vi.fn(),
      requestTransfer: vi.fn(),
      confirmTransfer: vi.fn(),
      rejectTransfer: vi.fn(),
    },
  }
})

const GROUP_ID = 'grp_01ab30b332e6'
const SELF_ID = 'user_self_1'
const TARGET_ID = 'user_target_2'
const OTHER_ID = 'user_other_3'

function userWith(role: GroupRole): CurrentUser {
  return {
    user_id: SELF_ID,
    display_name: '张老师',
    groups: [
      {
        group_id: GROUP_ID,
        name: '高一（1）班',
        owner_user_id: role === 'owner' ? SELF_ID : OTHER_ID,
        created_at: '2026-03-12T00:00:00Z',
        role,
      },
    ],
  }
}

function member(userId: string, role: GroupRole, name: string, isSelf = false): MemberDto {
  return { user_id: userId, display_name: name, role, joined_at: '2026-03-12T00:00:00Z', is_self: isSelf }
}

const members: MemberDto[] = [
  member(OTHER_ID, 'owner', '王老师'),
  member(SELF_ID, 'admin', '张老师', true),
  member(TARGET_ID, 'operator', '李老师'),
]

function transferDto(overrides: Partial<TransferDto> = {}): TransferDto {
  return {
    transfer_id: 'tr_01',
    group_id: GROUP_ID,
    from_user_id: OTHER_ID,
    to_user_id: SELF_ID,
    created_at: '2026-03-12T00:00:00Z',
    expires_at: '2026-03-14T00:00:00Z',
    status: 'pending',
    demoted_to: 'admin',
    ...overrides,
  }
}

interface Harness {
  wrapper: VueWrapper
  pending: Ref<PendingTransfer | null>
}

async function mountPanel(options: {
  role: GroupRole
  pending?: PendingTransfer | null
  ended?: boolean
}): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const session = useSessionStore(pinia)
  session.user = userWith(options.role)
  session.loaded = true
  vi.mocked(api.session).mockResolvedValue(userWith(options.role))

  const pending = ref<PendingTransfer | null>(options.pending ?? null)

  let wrapper: VueWrapper
  wrapper = mount(GroupTransferPanel, {
    props: {
      groupId: GROUP_ID,
      members,
      
      isOwner: options.role === 'owner',
      loadError: null,
      ended: options.ended ?? false,
      pending: pending.value,
      'onUpdate:pending': (next: PendingTransfer | null) => {
        pending.value = next
        void wrapper.setProps({ pending: next })
      },
    },
    global: { plugins: [pinia, createAppI18n('zh-CN')] },
  })

  return { wrapper, pending }
}


enableAutoUnmount(afterEach)

describe('GroupTransferPanel', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.pendingTransfer).mockReset()
    vi.mocked(api.requestTransfer).mockReset()
    vi.mocked(api.confirmTransfer).mockReset()
    vi.mocked(api.rejectTransfer).mockReset()
  })

  it('owner 选中成员发起转让后进入「等待确认」，并写明有效期', async () => {
    const { wrapper, pending } = await mountPanel({ role: 'owner' })
    vi.mocked(api.requestTransfer).mockResolvedValue(
      transferDto({ from_user_id: SELF_ID, to_user_id: TARGET_ID }),
    )

    
    
    await pickOption(wrapper.get('[data-testid="transfer-target"]'), '李老师 · 操作者')
    await wrapper.get('[data-testid="transfer-request"]').trigger('click')
    await flushPromises()

    expect(api.requestTransfer).toHaveBeenCalledWith(GROUP_ID, TARGET_ID)
    expect(pending.value?.transfer_id).toBe('tr_01')

    const waiting = wrapper.text()
    expect(waiting).toContain('等待')
    expect(waiting).toContain('李老师')
    
    expect(waiting).toContain('有效期至')
  })

  it('受让方（非 owner）能看到「接受 / 拒绝」，接受后重新拉会话', async () => {
    const { wrapper, pending } = await mountPanel({
      role: 'admin',
      pending: transferDto(),
    })
    vi.mocked(api.confirmTransfer).mockResolvedValue({ group_id: GROUP_ID, owner_user_id: SELF_ID })

    expect(wrapper.find('[data-testid="transfer-request"]').exists()).toBe(false)
    await wrapper.get('[data-testid="transfer-accept"]').trigger('click')
    await flushPromises()

    expect(api.confirmTransfer).toHaveBeenCalledWith(GROUP_ID, 'tr_01')
    expect(pending.value).toBeNull()
    
    expect(api.session).toHaveBeenCalled()
    expect(wrapper.get('[data-testid="transfer-confirmed"]').text()).toContain('你已成为创建者')  })

  it('受让方拒绝后给出回执，而不是让界面悄悄变回去', async () => {
    const { wrapper, pending } = await mountPanel({ role: 'admin', pending: transferDto() })
    vi.mocked(api.rejectTransfer).mockResolvedValue(undefined)

    await wrapper.get('[data-testid="transfer-reject"]').trigger('click')
    await flushPromises()

    expect(api.rejectTransfer).toHaveBeenCalledWith(GROUP_ID, 'tr_01')
    expect(pending.value).toBeNull()
    expect(wrapper.text()).toContain('已拒绝本次转让')
  })

  it('待确认状态由页面传入：切回页签时直接渲染，不需要组件自己去读', async () => {
    const { wrapper } = await mountPanel({
      role: 'owner',
      pending: transferDto({ from_user_id: SELF_ID, to_user_id: TARGET_ID }),
    })

    expect(wrapper.text()).toContain('等待')
    
    expect(api.pendingTransfer).not.toHaveBeenCalled()
  })

  it('上一次的转让已结束时说明结论，并给出重新发起', async () => {
    const { wrapper } = await mountPanel({ role: 'owner', ended: true })

    expect(wrapper.get('[data-testid="transfer-ended"]').text()).toContain('权限没有任何变化')
    expect(wrapper.find('[data-testid="transfer-request"]').exists()).toBe(false)

    await wrapper.get('[data-testid="transfer-restart"]').trigger('click')
    expect(wrapper.emitted('restart')).toHaveLength(1)
  })

  it('读取失败时显示错误文案，且不覆盖已有的待确认状态', async () => {
    const { wrapper, pending } = await mountPanel({
      role: 'owner',
      pending: transferDto({ from_user_id: SELF_ID, to_user_id: TARGET_ID }),
    })

    
    
    await wrapper.setProps({ loadError: 'network_error' })
    expect(wrapper.find('[data-testid="transfer-error"]').exists()).toBe(true)
    expect(pending.value).not.toBeNull()
    expect(wrapper.text()).toContain('等待')
  })

  





  it('pending 未接线（undefined）时卡片也必须照常渲染', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const session = useSessionStore(pinia)
    session.user = userWith('owner')
    session.loaded = true

    const wrapper = mount(GroupTransferPanel, {
      props: {
        groupId: GROUP_ID,
        members,
        isOwner: true,
        loadError: null,
        ended: false,
        
        
        
        
        
        pending: undefined as unknown as null,
      },
      global: { plugins: [pinia, createAppI18n('zh-CN')] },
    })

    expect(wrapper.text()).toContain('转让创建者')
    expect(wrapper.find('[data-testid="transfer-target"]').exists()).toBe(true)
  })
})
